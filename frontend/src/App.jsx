import { useState } from "react";
import { useContract } from "./hooks/useContract";
import IssuerPortal from "./views/IssuerPortal";
import HolderDashboard from "./views/HolderDashboard";
import VerifierLookup from "./views/VerifierLookup";

const VIEWS = ["verify", "holder", "issuer"];

export default function App() {
  const { contract, readContract, address, isOwner, isIssuer, error, connecting, connect } = useContract();

  const params = new URLSearchParams(window.location.search);
  const defaultView = VIEWS.includes(params.get("view")) ? params.get("view") : "verify";
  const [activeView, setActiveView] = useState(defaultView);

  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-mark">⬡</span>
            <span className="logo-text">CredentialSBT</span>
          </div>

          <nav className="nav">
            <button
              className={`nav-btn ${activeView === "verify" ? "active" : ""}`}
              onClick={() => setActiveView("verify")}
            >Verify</button>
            <button
              className={`nav-btn ${activeView === "holder" ? "active" : ""}`}
              onClick={() => setActiveView("holder")}
              disabled={!address}
            >My Credentials</button>
            {isIssuer && (
              <button
                className={`nav-btn ${activeView === "issuer" ? "active" : ""}`}
                onClick={() => setActiveView("issuer")}
              >Issuer Portal</button>
            )}
          </nav>

          <div className="wallet-area">
            {address ? (
              <div className="wallet-connected">
                <span className="wallet-dot" />
                <span className="wallet-addr">{shortAddr}</span>
                {isOwner && <span className="role-tag owner">Owner</span>}
                {isIssuer && !isOwner && <span className="role-tag issuer">Issuer</span>}
              </div>
            ) : (
              <button className="btn btn-connect" onClick={connect} disabled={connecting}>
                {connecting ? <><span className="spinner small" /> Connecting...</> : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>

        {error && <div className="header-error">{error}</div>}
      </header>

      <main className="main">
        {activeView === "verify" && (
          <VerifierLookup />
        )}
        {activeView === "holder" && address && (
          <HolderDashboard readContract={readContract} address={address} />
        )}
        {activeView === "holder" && !address && (
          <div className="connect-prompt">
            <p>Connect your wallet to view your credentials.</p>
            <button className="btn btn-primary" onClick={connect}>Connect Wallet</button>
          </div>
        )}
        {activeView === "issuer" && isIssuer && (
          <IssuerPortal contract={contract} isOwner={isOwner} />
        )}
      </main>
    </div>
  );
}
