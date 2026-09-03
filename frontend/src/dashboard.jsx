import React, { useEffect, useMemo, useState } from "react";
import { Search, ArrowUp, ArrowDown, MapPin, Clock, Link2, ShieldAlert } from "lucide-react";

const STATUSES = ["Flagged", "Under Investigation", "False Positive"];

function riskTier(score) {
  if (score >= 0.75) return { label: "High", color: "#c81e3a" };
  if (score >= 0.45) return { label: "Medium", color: "#e8a33d" };
  return { label: "Low", color: "#7d8f7a" };
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function highlightTerms(text, terms) {
  if (!terms.length) return text;
  const pattern = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    terms.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
      <mark key={i} className="ncw-mark">
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

export default function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [sortDesc, setSortDesc] = useState(true);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadPosts = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/posts");
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        const data = await response.json();
        if (!cancelled) {
          const nextPosts = Array.isArray(data.posts) ? data.posts : [];
          setPosts(nextPosts);
          setSelectedId((current) => current ?? nextPosts[0]?.post_id ?? null);
        }
      } catch {
        if (!cancelled) setError("Unable to load intelligence data. Check that the backend is running.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPosts();
    return () => {
      cancelled = true;
    };
  }, []);

  const statuses = useMemo(
    () => Object.fromEntries(posts.map((post) => [post.post_id, post.status || "Flagged"])),
    [posts]
  );

  const updateStatus = async (postId, status) => {
    const previousPosts = posts;
    setPosts((current) =>
      current.map((post) => (post.post_id === postId ? { ...post, status } : post))
    );

    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(postId)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      const updated = await response.json();
      setPosts((current) =>
        current.map((post) => (post.post_id === postId ? { ...post, ...updated } : post))
      );
    } catch {
      setPosts(previousPosts);
      setError("Status update failed. The previous status was restored.");
    }
  };

  const filtered = useMemo(() => {
    let list = posts.filter(
      (p) =>
        p.account.toLowerCase().includes(query.toLowerCase()) ||
        p.location.toLowerCase().includes(query.toLowerCase()) ||
        p.flagged_terms.some((t) => t.toLowerCase().includes(query.toLowerCase()))
    );
    list.sort((a, b) => (sortDesc ? b.risk_score - a.risk_score : a.risk_score - b.risk_score));
    return list;
  }, [posts, query, sortDesc]);

  const selected = posts.find((p) => p.post_id === selectedId) || filtered[0];

  const stats = useMemo(() => {
    const high = posts.filter((p) => p.risk_score >= 0.75).length;
    const underInvestigation = Object.values(statuses).filter((s) => s === "Under Investigation").length;
    return { total: posts.length, high, underInvestigation };
  }, [posts, statuses]);

  // radial layout for the connection graph
  const graphNodes = useMemo(() => {
    if (!selected) return [];
    const conns = selected.connections;
    const R = 92;
    const cx = 150,
      cy = 130;
    return conns.map((id, i) => {
      const angle = (i / Math.max(conns.length, 1)) * 2 * Math.PI - Math.PI / 2;
      return {
        id,
        x: cx + R * Math.cos(angle),
        y: cy + R * Math.sin(angle),
      };
    });
  }, [selected]);

  if (loading) {
    return <div className="ncw-root">
      {error && <div style={{ marginBottom: 12, padding: "8px 12px", border: "1px solid var(--border)", background: "var(--panel)", color: "var(--text-dim)", fontSize: 11 }}>{error}</div>}<div className="ncw-panel" style={{ padding: 24 }}>Loading intelligence feed…</div></div>;
  }

  if (error && !posts.length) {
    return <div className="ncw-root"><div className="ncw-panel" style={{ padding: 24, color: "#f2e9e4" }}>{error}</div></div>;
  }

  if (!selected) {
    return <div className="ncw-root"><div className="ncw-panel" style={{ padding: 24 }}>No intelligence records available.</div></div>;
  }
  const tier = riskTier(selected.risk_score);

  // Render any extra fields added to posts.json without requiring a frontend
  // code change for every new data attribute. Core fields already have
  // dedicated UI sections, so they are excluded here.
  const CORE_FIELDS = new Set([
    "post_id", "account", "text", "timestamp", "location",
    "risk_score", "confidence", "flagged_terms", "flagged_spans",
    "connections", "status"
  ]);

  const extraFields = Object.entries(selected)
    .filter(([key, value]) => !CORE_FIELDS.has(key) && value !== null && value !== undefined && value !== "")
    .map(([key, value]) => ({
      key,
      value: Array.isArray(value) ? value.join(", ") : typeof value === "object" ? JSON.stringify(value) : String(value)
    }));

  return (
    <div className="ncw-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .ncw-root {
          --bg: #0d0b0d;
          --panel: #171113;
          --panel-red: #4a1119;
          --panel-red-light: #5c1420;
          --border: #34181c;
          --alert: #c81e3a;
          --amber: #e8a33d;
          --low: #7d8f7a;
          --text: #f2e9e4;
          --text-dim: #a98a90;
          font-family: 'JetBrains Mono', monospace;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          padding: 20px;
          box-sizing: border-box;
        }
        .ncw-root * { box-sizing: border-box; }
        .ncw-display { font-family: 'Oswald', sans-serif; }

        .ncw-topbar {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          padding-bottom: 16px;
          margin-bottom: 18px;
          border-bottom: 1px solid var(--border);
        }
        .ncw-title {
          font-size: 26px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: var(--text);
          text-transform: uppercase;
        }
        .ncw-title span { color: var(--alert); }
        .ncw-subtitle {
          font-size: 12px;
          color: var(--text-dim);
          margin-top: 2px;
          font-family: 'JetBrains Mono', monospace;
        }
        .ncw-stats { display: flex; gap: 22px; }
        .ncw-stat { text-align: right; }
        .ncw-stat-num { font-family: 'Oswald', sans-serif; font-size: 22px; font-weight: 600; line-height: 1; }
        .ncw-stat-label { font-size: 10px; color: var(--text-dim); letter-spacing: 0.06em; }

        .ncw-layout {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 16px;
        }
        @media (max-width: 860px) {
          .ncw-layout { grid-template-columns: 1fr; }
        }

        .ncw-panel {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 4px;
          overflow: hidden;
        }
        .ncw-panel-head {
          padding: 12px 14px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .ncw-panel-head h2 {
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.04em;
          margin: 0;
          text-transform: uppercase;
          color: var(--text-dim);
        }

        .ncw-search {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 3px;
          padding: 5px 8px;
          flex: 1;
          max-width: 220px;
        }
        .ncw-search input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text);
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          width: 100%;
        }
        .ncw-search input::placeholder { color: var(--text-dim); }

        .ncw-sortbtn {
          display: flex; align-items: center; gap: 5px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-dim);
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          padding: 5px 8px;
          border-radius: 3px;
          cursor: pointer;
        }
        .ncw-sortbtn:hover { color: var(--text); border-color: var(--text-dim); }

        table.ncw-table { width: 100%; border-collapse: collapse; }
        .ncw-table th {
          text-align: left;
          font-size: 10px;
          letter-spacing: 0.05em;
          color: var(--text-dim);
          font-weight: 500;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border);
        }
        .ncw-row {
          cursor: pointer;
          border-bottom: 1px solid var(--border);
          transition: background 0.12s ease;
        }
        .ncw-row:hover { background: rgba(200,30,58,0.06); }
        .ncw-row.active { background: rgba(200,30,58,0.14); }
        .ncw-row td { padding: 10px 12px; font-size: 12px; vertical-align: middle; }
        .ncw-acct { font-weight: 600; color: var(--text); }
        .ncw-loc { color: var(--text-dim); font-size: 11px; display: flex; align-items: center; gap: 4px; margin-top: 2px;}

        .ncw-riskcell { display: flex; align-items: center; gap: 8px; min-width: 100px; }
        .ncw-riskbar-track {
          flex: 1;
          height: 5px;
          background: #241417;
          border-radius: 3px;
          overflow: hidden;
        }
        .ncw-riskbar-fill { height: 100%; border-radius: 3px; }
        .ncw-risknum { font-size: 11px; font-weight: 600; width: 30px; text-align: right; }

        .ncw-terms { display: flex; flex-wrap: wrap; gap: 4px; }
        .ncw-term-chip {
          background: rgba(200,30,58,0.14);
          color: #f0a8b3;
          border: 1px solid rgba(200,30,58,0.3);
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 2px;
        }

        .ncw-detail { padding: 16px; }
        .ncw-detail-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .ncw-detail-acct { font-family: 'Oswald', sans-serif; font-size: 20px; font-weight: 600; }
        .ncw-detail-meta { color: var(--text-dim); font-size: 11px; margin-top: 4px; display: flex; gap: 12px; flex-wrap: wrap; }
        .ncw-detail-meta span { display: flex; align-items: center; gap: 4px; }

        .ncw-tierbadge {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 3px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        .ncw-postbox {
          background: var(--bg);
          border: 1px solid var(--border);
          border-left: 3px solid var(--alert);
          border-radius: 3px;
          padding: 12px;
          font-size: 13px;
          line-height: 1.6;
          margin-bottom: 16px;
        }
        .ncw-mark {
          background: rgba(232,163,61,0.25);
          color: var(--amber);
          padding: 0 2px;
          border-radius: 2px;
          font-weight: 600;
        }

        .ncw-section-label {
          font-size: 10px;
          letter-spacing: 0.06em;
          color: var(--text-dim);
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .ncw-status-row { display: flex; gap: 6px; margin-bottom: 18px; flex-wrap: wrap; }
        .ncw-status-btn {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          padding: 6px 10px;
          border-radius: 3px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-dim);
          cursor: pointer;
        }
        .ncw-status-btn.active {
          background: var(--alert);
          border-color: var(--alert);
          color: #fff;
        }

        .ncw-extra-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 14px;
        }
        .ncw-extra-item {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 3px;
          padding: 9px 10px;
          min-width: 0;
        }
        .ncw-extra-key {
          color: var(--text-dim);
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        .ncw-extra-value {
          color: var(--text);
          font-size: 11px;
          overflow-wrap: anywhere;
          line-height: 1.45;
        }
        @media (max-width: 560px) {
          .ncw-extra-grid { grid-template-columns: 1fr; }
        }

        .ncw-graph-wrap { margin-bottom: 4px; }
        .ncw-graph-node-label {
          font-size: 9px;
          fill: var(--text-dim);
          font-family: 'JetBrains Mono', monospace;
        }

        .ncw-legend { display: flex; align-items: center; gap: 10px; }
        .ncw-legend-item { display: flex; align-items: center; gap: 4px; font-size: 10px; color: var(--text-dim); }
        .ncw-legend-dot { width: 7px; height: 7px; border-radius: 50%; }

        .ncw-table-scroll { max-height: 420px; overflow-y: auto; }

        .ncw-footer {
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 10px;
          color: var(--text-dim);
          letter-spacing: 0.04em;
        }
        .ncw-footer b { color: var(--text); }
      `}</style>

      <div className="ncw-topbar">
        <div>
          <div className="ncw-title ncw-display">
            NarcoNet<span>Watch</span>
          </div>
          <div className="ncw-subtitle">Command Dashboard — Anti-Narcotics Intelligence</div>
        </div>
        <div className="ncw-stats">
          <div className="ncw-stat">
            <div className="ncw-stat-num">{stats.total}</div>
            <div className="ncw-stat-label">FLAGGED ACCOUNTS</div>
          </div>
          <div className="ncw-stat">
            <div className="ncw-stat-num" style={{ color: "var(--alert)" }}>
              {stats.high}
            </div>
            <div className="ncw-stat-label">HIGH RISK</div>
          </div>
          <div className="ncw-stat">
            <div className="ncw-stat-num" style={{ color: "var(--amber)" }}>
              {stats.underInvestigation}
            </div>
            <div className="ncw-stat-label">UNDER REVIEW</div>
          </div>
        </div>
      </div>

      <div className="ncw-layout">
        {/* LEFT: account table */}
        <div className="ncw-panel">
          <div className="ncw-panel-head">
            <h2>Flagged Accounts</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <div className="ncw-search">
                <Search size={13} color="#a98a90" />
                <input
                  placeholder="search account, location, term..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button className="ncw-sortbtn" onClick={() => setSortDesc((s) => !s)}>
                {sortDesc ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                RISK
              </button>
            </div>
          </div>
          <div style={{ padding: "8px 14px 0", }} className="ncw-legend">
            <span style={{ fontSize: 10, color: "var(--text-dim)" }}>LEGEND:</span>
            <span className="ncw-legend-item">
              <span className="ncw-legend-dot" style={{ background: "#c81e3a" }} /> High (≥0.75)
            </span>
            <span className="ncw-legend-item">
              <span className="ncw-legend-dot" style={{ background: "#e8a33d" }} /> Medium (0.45–0.74)
            </span>
            <span className="ncw-legend-item">
              <span className="ncw-legend-dot" style={{ background: "#7d8f7a" }} /> Low (&lt;0.45)
            </span>
          </div>
          <div className="ncw-table-scroll">
            <table className="ncw-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Risk score</th>
                  <th>Flagged terms</th>
                  <th>Detected</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const t = riskTier(p.risk_score);
                  return (
                    <tr
                      key={p.post_id}
                      className={`ncw-row ${p.post_id === selected.post_id ? "active" : ""}`}
                      onClick={() => setSelectedId(p.post_id)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedId(p.post_id)}
                    >
                      <td>
                        <div className="ncw-acct">{p.account}</div>
                        <div className="ncw-loc">
                          <MapPin size={10} /> {p.location}
                        </div>
                      </td>
                      <td>
                        <div className="ncw-riskcell">
                          <div className="ncw-riskbar-track">
                            <div
                              className="ncw-riskbar-fill"
                              style={{ width: `${p.risk_score * 100}%`, background: t.color }}
                            />
                          </div>
                          <div className="ncw-risknum" style={{ color: t.color }}>
                            {p.risk_score.toFixed(2)}
                          </div>
                        </div>
                      </td>
                      <td>
                        {p.flagged_terms.length ? (
                          <div className="ncw-terms">
                            {p.flagged_terms.map((term) => (
                              <span key={term} className="ncw-term-chip">
                                {term}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--text-dim)", fontStyle: "italic" }}>
                            No flagged terms
                          </span>
                        )}
                      </td>
                      <td style={{ color: "var(--text-dim)", fontSize: 11 }}>{formatTime(p.timestamp)}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: 20, color: "var(--text-dim)", textAlign: "center" }}>
                      No accounts match that search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="ncw-footer" style={{ padding: "0 14px 12px" }}>
            <span>
              Team <b>Power Rangers</b> · SRM KTR
            </span>
            <span>Track: Anti-Narcotics Intelligence</span>
          </div>
        </div>

        {/* RIGHT: detail view */}
        <div className="ncw-panel">
          <div className="ncw-panel-head">
            <h2>Detail View</h2>
          </div>
          <div className="ncw-detail">
            <div className="ncw-detail-head">
              <div>
                <div className="ncw-detail-acct">{selected.account}</div>
                <div className="ncw-detail-meta">
                  <span>
                    <Clock size={11} /> {formatTime(selected.timestamp)}
                  </span>
                  <span>
                    <MapPin size={11} /> {selected.location}
                  </span>
                  <span>
                    <Link2 size={11} /> {selected.connections.length} connection
                    {selected.connections.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div
                className="ncw-tierbadge"
                style={{ background: `${tier.color}22`, color: tier.color, border: `1px solid ${tier.color}55` }}
              >
                {tier.label} · {selected.risk_score.toFixed(2)}
              </div>
            </div>

            <div className="ncw-section-label">Source post — {selected.post_id}</div>
            <div className="ncw-postbox">{highlightTerms(selected.text, selected.flagged_terms)}</div>

            {extraFields.length > 0 && (
              <>
                <div className="ncw-section-label">Additional intelligence</div>
                <div className="ncw-extra-grid">
                  {extraFields.map(({ key, value }) => (
                    <div className="ncw-extra-item" key={key}>
                      <div className="ncw-extra-key">{key.replace(/_/g, " ")}</div>
                      <div className="ncw-extra-value">{value}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="ncw-section-label">Investigation status</div>
            <div className="ncw-status-row">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  className={`ncw-status-btn ${statuses[selected.post_id] === s ? "active" : ""}`}
                  onClick={() => updateStatus(selected.post_id, s)}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="ncw-section-label">Network graph</div>
            <div className="ncw-graph-wrap">
              <svg viewBox="0 0 300 240" width="100%" height="220">
                {graphNodes.map((n) => (
                  <line
                    key={`edge-${n.id}`}
                    x1="150"
                    y1="130"
                    x2={n.x}
                    y2={n.y}
                    stroke="#4a1119"
                    strokeWidth="2"
                  />
                ))}
                {/* hub node */}
                <circle cx="150" cy="130" r="22" fill="#c81e3a" stroke="#f0a8b3" strokeWidth="1.5" />
                <text x="150" y="134" textAnchor="middle" fontSize="9" fill="#fff" fontFamily="JetBrains Mono, monospace" fontWeight="600">
                  {selected.account.length > 10 ? selected.account.slice(0, 9) + "…" : selected.account}
                </text>
                {graphNodes.map((n) => (
                  <g key={n.id}>
                    <circle cx={n.x} cy={n.y} r="16" fill="#5c1420" stroke="#a98a90" strokeWidth="1" />
                    <text
                      x={n.x}
                      y={n.y + 3}
                      textAnchor="middle"
                      fontSize="8"
                      fill="#f2e9e4"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {n.id.length > 8 ? n.id.slice(0, 7) + "…" : n.id}
                    </text>
                  </g>
                ))}
                {graphNodes.length === 0 && (
                  <text x="150" y="130" textAnchor="middle" fontSize="10" fill="#a98a90">
                    no linked accounts
                  </text>
                )}
              </svg>
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 10,
                color: "var(--text-dim)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                borderTop: "1px solid var(--border)",
                paddingTop: 10,
              }}
            >
              <ShieldAlert size={12} />
              Intelligence lead only — no automated enforcement action.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}