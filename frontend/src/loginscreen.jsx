import { useState } from "react";

// This component takes ONE prop: onEnter (a function).
// It doesn't know or care what happens after — it just CALLS onEnter()
// when login is done. The parent (App.jsx) decides what that means.
export default function LoginScreen({ onEnter }) {
  const [stage, setStage] = useState("form"); // form -> verifying -> greeting
  const [pin, setPin] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault(); // stops the page from reloading (default HTML form behavior)
    setStage("verifying");

    setTimeout(() => setStage("greeting"), 900);
    setTimeout(() => {
      onEnter(); // <-- THIS is the line that tells App.jsx "login is done, switch pages"
    }, 2200);
  };

  return (
    <div className="ncw-login-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .ncw-login-root {
          --bg: #0d0b0d;
          --panel: #171113;
          --border: #34181c;
          --alert: #c81e3a;
          --text: #f2e9e4;
          --text-dim: #a98a90;
          font-family: 'JetBrains Mono', monospace;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        .ncw-login-scanlines {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,0.015) 0px,
            rgba(255,255,255,0.015) 1px,
            transparent 1px,
            transparent 3px
          );
          pointer-events: none;
        }
        .ncw-login-card {
          position: relative;
          width: 360px;
          max-width: 90vw;
          background: var(--panel);
          border: 1px solid var(--border);
          border-top: 3px solid var(--alert);
          border-radius: 4px;
          padding: 30px 28px 26px;
          animation: ncw-fadein 0.5s ease;
        }
        @keyframes ncw-fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .ncw-login-tag {
          font-size: 10px; letter-spacing: 0.12em; color: var(--text-dim);
          text-transform: uppercase; display: flex; align-items: center; gap: 6px; margin-bottom: 14px;
        }
        .ncw-login-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--alert); box-shadow: 0 0 6px var(--alert); }
        .ncw-login-title { font-family: 'Oswald', sans-serif; font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; margin-bottom: 2px; }
        .ncw-login-title span { color: var(--alert); }
        .ncw-login-sub { font-size: 11px; color: var(--text-dim); margin-bottom: 22px; }
        .ncw-field-label { font-size: 10px; letter-spacing: 0.06em; color: var(--text-dim); text-transform: uppercase; margin-bottom: 6px; display: block; }
        .ncw-field { width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: 3px; padding: 10px 12px; color: var(--text); font-family: 'JetBrains Mono', monospace; font-size: 13px; margin-bottom: 16px; outline: none; }
        .ncw-field:focus { border-color: var(--alert); }
        .ncw-field[readonly] { color: var(--text-dim); cursor: default; }
        .ncw-login-btn { width: 100%; background: var(--alert); border: none; color: #fff; font-family: 'JetBrains Mono', monospace; font-weight: 600; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; padding: 12px; border-radius: 3px; cursor: pointer; transition: background 0.15s ease; }
        .ncw-login-btn:hover { background: #a3172f; }
        .ncw-login-footer { margin-top: 18px; font-size: 10px; color: var(--text-dim); text-align: center; letter-spacing: 0.03em; }
        .ncw-verify-wrap { text-align: center; padding: 10px 0 4px; }
        .ncw-verify-bar-track { width: 100%; height: 4px; background: #241417; border-radius: 3px; overflow: hidden; margin: 16px 0 10px; }
        .ncw-verify-bar-fill { height: 100%; background: var(--alert); animation: ncw-loadbar 0.9s ease forwards; }
        @keyframes ncw-loadbar { from { width: 0%; } to { width: 100%; } }
        .ncw-verify-text { font-size: 11px; color: var(--text-dim); letter-spacing: 0.04em; }
        .ncw-greet-wrap { text-align: center; padding: 10px 0; animation: ncw-fadein 0.4s ease; }
        .ncw-greet-hello { font-family: 'Oswald', sans-serif; font-size: 30px; font-weight: 700; letter-spacing: 0.01em; }
        .ncw-greet-hello span { color: var(--alert); }
        .ncw-greet-sub { font-size: 11px; color: var(--text-dim); margin-top: 8px; letter-spacing: 0.04em; }
      `}</style>
      <div className="ncw-login-scanlines" />

      <div className="ncw-login-card">
        <div className="ncw-login-tag">
          <span className="ncw-login-dot" />
          SECURE ACCESS TERMINAL
        </div>

        {stage === "form" && (
          <>
            <div className="ncw-login-title">NARCONET<span>WATCH</span></div>
            <div className="ncw-login-sub">Investigator clearance required to proceed.</div>
            <form onSubmit={handleSubmit}>
              <label className="ncw-field-label">Investigator ID</label>
              <input className="ncw-field" defaultValue="admin" readOnly />
              <label className="ncw-field-label">Access PIN</label>
              <input
                className="ncw-field"
                type="password"
                placeholder="••••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
              {/* type="submit" is what makes pressing Enter OR clicking the button both trigger handleSubmit */}
              <button type="submit" className="ncw-login-btn">
                Authenticate &amp; Enter
              </button>
            </form>
            <div className="ncw-login-footer">Anti-Narcotics Intelligence Division · Track 04</div>
          </>
        )}

        {stage === "verifying" && (
          <div className="ncw-verify-wrap">
            <div className="ncw-login-title">NARCONET<span>WATCH</span></div>
            <div className="ncw-verify-bar-track"><div className="ncw-verify-bar-fill" /></div>
            <div className="ncw-verify-text">Verifying clearance…</div>
          </div>
        )}

        {stage === "greeting" && (
          <div className="ncw-greet-wrap">
            <div className="ncw-greet-hello">Hello, <span>admin</span></div>
            <div className="ncw-greet-sub">Clearance confirmed — opening Command Dashboard</div>
          </div>
        )}
      </div>
    </div>
  );
}