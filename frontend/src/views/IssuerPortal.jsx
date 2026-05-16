import { useState } from "react";
import { ethers } from "ethers";

export default function IssuerPortal({ contract, isOwner }) {
  // Issue credential state
  const [recipient, setRecipient] = useState("");
  const [ipfsHash, setIpfsHash] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [issueResult, setIssueResult] = useState(null);

  // Revoke credential state
  const [revokeId, setRevokeId] = useState("");
  const [revoking, setRevoking] = useState(false);
  const [revokeResult, setRevokeResult] = useState(null);

  // Authorize issuer state (owner only)
  const [issuerAddr, setIssuerAddr] = useState("");
  const [authAction, setAuthAction] = useState("authorize");
  const [authWorking, setAuthWorking] = useState(false);
  const [authResult, setAuthResult] = useState(null);

  const [error, setError] = useState(null);

  const clearAll = () => { setError(null); setIssueResult(null); setRevokeResult(null); setAuthResult(null); };

  const handleIssue = async (e) => {
    e.preventDefault();
    clearAll();
    if (!ethers.isAddress(recipient)) { setError("Invalid recipient address."); return; }
    if (!ipfsHash.trim()) { setError("IPFS hash cannot be empty."); return; }
    setIssuing(true);
    try {
      const tx = await contract.issueCredential(recipient, ipfsHash.trim());
      const receipt = await tx.wait();
      const event = receipt.logs
        .map(log => { try { return contract.interface.parseLog(log); } catch { return null; } })
        .find(e => e?.name === "CredentialIssued");
      const tokenId = event ? event.args.tokenId.toString() : "unknown";
      setIssueResult({ tokenId, txHash: receipt.hash });
      setRecipient(""); setIpfsHash("");
    } catch (err) {
      setError(err.reason || err.message);
    } finally {
      setIssuing(false);
    }
  };

  const handleRevoke = async (e) => {
    e.preventDefault();
    clearAll();
    if (!revokeId.trim()) { setError("Enter a token ID."); return; }
    setRevoking(true);
    try {
      const tx = await contract.revokeCredential(Number(revokeId));
      const receipt = await tx.wait();
      setRevokeResult({ txHash: receipt.hash });
      setRevokeId("");
    } catch (err) {
      setError(err.reason || err.message);
    } finally {
      setRevoking(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    clearAll();
    if (!ethers.isAddress(issuerAddr)) { setError("Invalid issuer address."); return; }
    setAuthWorking(true);
    try {
      const tx = authAction === "authorize"
        ? await contract.authorizeIssuer(issuerAddr)
        : await contract.revokeIssuer(issuerAddr);
      await tx.wait();
      setAuthResult({ action: authAction, address: issuerAddr });
      setIssuerAddr("");
    } catch (err) {
      setError(err.reason || err.message);
    } finally {
      setAuthWorking(false);
    }
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-badge issuer-badge">ISSUER</div>
        <h2>Issuer Portal</h2>
        <p className="view-sub">Mint credentials and manage issuers on-chain</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Issue Credential */}
      <div className="card">
        <h3 className="card-title">
          <span className="card-num">01</span> Issue Credential
        </h3>
        <form onSubmit={handleIssue} className="form">
          <div className="field">
            <label>Recipient Wallet Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              disabled={issuing}
            />
          </div>
          <div className="field">
            <label>IPFS Hash (credential metadata)</label>
            <input
              type="text"
              placeholder="Qm... or bafyrei..."
              value={ipfsHash}
              onChange={e => setIpfsHash(e.target.value)}
              disabled={issuing}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={issuing}>
            {issuing ? <span className="spinner" /> : null}
            {issuing ? "Minting..." : "Issue Credential"}
          </button>
        </form>
        {issueResult && (
          <div className="alert alert-success">
            ✓ Credential issued — Token ID <strong>#{issueResult.tokenId}</strong>
            <a href={`https://sepolia.etherscan.io/tx/${issueResult.txHash}`} target="_blank" rel="noreferrer" className="tx-link">
              View on Etherscan ↗
            </a>
          </div>
        )}
      </div>

      {/* Revoke Credential */}
      <div className="card">
        <h3 className="card-title">
          <span className="card-num">02</span> Revoke Credential
        </h3>
        <form onSubmit={handleRevoke} className="form">
          <div className="field">
            <label>Token ID to Revoke</label>
            <input
              type="number"
              placeholder="e.g. 42"
              value={revokeId}
              onChange={e => setRevokeId(e.target.value)}
              disabled={revoking}
              min="0"
            />
          </div>
          <button type="submit" className="btn btn-danger" disabled={revoking}>
            {revoking ? <span className="spinner" /> : null}
            {revoking ? "Revoking..." : "Revoke Credential"}
          </button>
        </form>
        {revokeResult && (
          <div className="alert alert-success">
            ✓ Credential revoked
            <a href={`https://sepolia.etherscan.io/tx/${revokeResult.txHash}`} target="_blank" rel="noreferrer" className="tx-link">
              View on Etherscan ↗
            </a>
          </div>
        )}
      </div>

      {/* Manage Issuers — owner only */}
      {isOwner && (
        <div className="card">
          <h3 className="card-title">
            <span className="card-num">03</span> Manage Authorized Issuers
            <span className="owner-tag">Owner Only</span>
          </h3>
          <form onSubmit={handleAuth} className="form">
            <div className="field">
              <label>Issuer Wallet Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={issuerAddr}
                onChange={e => setIssuerAddr(e.target.value)}
                disabled={authWorking}
              />
            </div>
            <div className="toggle-row">
              <button
                type="button"
                className={`toggle-btn ${authAction === "authorize" ? "active" : ""}`}
                onClick={() => setAuthAction("authorize")}
              >Authorize</button>
              <button
                type="button"
                className={`toggle-btn ${authAction === "revoke" ? "active danger" : ""}`}
                onClick={() => setAuthAction("revoke")}
              >Revoke</button>
            </div>
            <button type="submit" className={`btn ${authAction === "authorize" ? "btn-primary" : "btn-danger"}`} disabled={authWorking}>
              {authWorking ? <span className="spinner" /> : null}
              {authWorking ? "Submitting..." : `${authAction === "authorize" ? "Authorize" : "Revoke"} Issuer`}
            </button>
          </form>
          {authResult && (
            <div className="alert alert-success">
              ✓ Issuer <strong>{authResult.address.slice(0,6)}...{authResult.address.slice(-4)}</strong> {authResult.action === "authorize" ? "authorized" : "revoked"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
