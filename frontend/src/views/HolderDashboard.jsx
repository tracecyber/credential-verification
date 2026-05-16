import { useState, useEffect, useCallback } from "react";

export default function HolderDashboard({ readContract, address }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [metaCache, setMetaCache] = useState({});

  const loadTokens = useCallback(async () => {
    if (!readContract || !address) return;
    setLoading(true);
    setError(null);
    try {
      const ids = await readContract.getHolderTokens(address);
      const details = await Promise.all(
        ids.map(async (id) => {
          const { valid, ipfsHash, holder } = await readContract.verifyCredential(id);
          return { id: id.toString(), valid, ipfsHash, holder };
        })
      );
      setTokens(details.reverse()); // newest first
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [readContract, address]);

  useEffect(() => { loadTokens(); }, [loadTokens]);

  const fetchMeta = async (tokenId, ipfsHash) => {
    if (metaCache[tokenId]) { setExpanded(expanded === tokenId ? null : tokenId); return; }
    try {
      const url = `https://ipfs.io/ipfs/${ipfsHash}`;
      const res = await fetch(url);
      const data = await res.json();
      setMetaCache(prev => ({ ...prev, [tokenId]: data }));
    } catch {
      setMetaCache(prev => ({ ...prev, [tokenId]: { error: "Could not fetch metadata from IPFS." } }));
    }
    setExpanded(expanded === tokenId ? null : tokenId);
  };

  const shareLink = (tokenId) => {
    const url = `${window.location.origin}?view=verify&tokenId=${tokenId}`;
    navigator.clipboard.writeText(url);
    alert(`Verification link copied!\n\n${url}`);
  };

  if (loading) return (
    <div className="view-container">
      <div className="loading-state">
        <div className="spinner large" />
        <p>Loading your credentials...</p>
      </div>
    </div>
  );

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-badge holder-badge">HOLDER</div>
        <h2>My Credentials</h2>
        <p className="view-sub">
          Wallet: <span className="mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {tokens.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">🎓</div>
          <p>No credentials found for this wallet.</p>
        </div>
      )}

      <div className="token-grid">
        {tokens.map(token => (
          <div key={token.id} className={`token-card ${!token.valid ? "revoked" : ""}`}>
            <div className="token-header">
              <div className="token-id">Token #{token.id}</div>
              <div className={`status-badge ${token.valid ? "valid" : "revoked"}`}>
                {token.valid ? "✓ Valid" : "✗ Revoked"}
              </div>
            </div>

            <div className="token-hash">
              <span className="label">IPFS</span>
              <span className="mono small">{token.ipfsHash.slice(0, 20)}...</span>
            </div>

            <div className="token-actions">
              <button
                className="btn-small btn-outline"
                onClick={() => fetchMeta(token.id, token.ipfsHash)}
              >
                {expanded === token.id ? "Hide Details" : "View Details"}
              </button>
              {token.valid && (
                <button className="btn-small btn-ghost" onClick={() => shareLink(token.id)}>
                  Share 🔗
                </button>
              )}
              <a
                href={`https://ipfs.io/ipfs/${token.ipfsHash}`}
                target="_blank"
                rel="noreferrer"
                className="btn-small btn-ghost"
              >
                IPFS ↗
              </a>
            </div>

            {expanded === token.id && metaCache[token.id] && (
              <div className="meta-panel">
                {metaCache[token.id].error
                  ? <p className="meta-error">{metaCache[token.id].error}</p>
                  : (
                    <table className="meta-table">
                      <tbody>
                        {Object.entries(metaCache[token.id]).map(([k, v]) => (
                          <tr key={k}>
                            <td className="meta-key">{k}</td>
                            <td className="meta-val">{String(v)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                }
              </div>
            )}
          </div>
        ))}
      </div>

      <button className="btn btn-outline refresh-btn" onClick={loadTokens}>
        ↻ Refresh
      </button>
    </div>
  );
}
