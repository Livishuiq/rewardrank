import { useState, useEffect } from "react";
import "./index.css";

const API = "https://rewardrank-backend.onrender.com";

function Section({ title, children }) {
  return (
    <div className="glass pink-glow p-6 mb-6">
      <h2 className="text-lg font-semibold text-white mb-4 tracking-wide uppercase" style={{ color: "#FF4FA2" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div className="mb-4">
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <input
        className="w-full px-4 py-2 rounded-lg text-white text-sm outline-none focus:ring-1"
        style={{
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.12)",
          focusRingColor: "#FF4FA2",
        }}
        {...props}
      />
    </div>
  );
}

function StatusMsg({ msg }) {
  if (!msg) return null;
  const isErr = msg.startsWith("Error") || msg.startsWith("❌");
  return (
    <p className={`text-sm mt-2 ${isErr ? "text-red-400" : "text-green-400"}`}>{msg}</p>
  );
}

export default function App() {
  // Transaction form state
  const [txUserId, setTxUserId] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txId, setTxId] = useState("");
  const [txMsg, setTxMsg] = useState("");

  // Summary state
  const [sumUserId, setSumUserId] = useState("");
  const [summary, setSummary] = useState(null);
  const [sumMsg, setSumMsg] = useState("");

  // Ranking state
  const [ranking, setRanking] = useState([]);
  const [rankLoading, setRankLoading] = useState(false);

  const submitTransaction = async () => {
    setTxMsg("");
    if (!txUserId || !txAmount || !txId) {
      setTxMsg("❌ All fields are required.");
      return;
    }
    try {
      const res = await fetch(`${API}/transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: txUserId,
          amount: parseFloat(txAmount),
          transactionId: txId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTxMsg(`❌ ${data.detail || "Request failed"}`);
      } else {
        setTxMsg("✓ Transaction processed successfully.");
        setTxUserId(""); setTxAmount(""); setTxId("");
        fetchRanking();
      }
    } catch {
      setTxMsg("❌ Could not reach server.");
    }
  };

  const fetchSummary = async () => {
    setSumMsg(""); setSummary(null);
    if (!sumUserId) { setSumMsg("❌ Enter a User ID."); return; }
    try {
      const res = await fetch(`${API}/summary/${encodeURIComponent(sumUserId)}`);
      const data = await res.json();
      if (!res.ok) { setSumMsg(`❌ ${data.detail}`); }
      else { setSummary(data); }
    } catch {
      setSumMsg("❌ Could not reach server.");
    }
  };

  const fetchRanking = async () => {
    setRankLoading(true);
    try {
      const res = await fetch(`${API}/ranking`);
      const data = await res.json();
      setRanking(data);
    } catch { /* silent */ }
    setRankLoading(false);
  };

  useEffect(() => { fetchRanking(); }, []);

  return (
    <div className="min-h-screen" style={{ background: "#0B0B0B" }}>
      {/* Hero */}
      <header className="text-center py-16 px-4">
        <div className="float inline-block mb-4">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-2xl"
            style={{ background: "linear-gradient(135deg, #FF4FA2, #ff80bf)" }}>
            ★
          </div>
        </div>
        <h1 className="text-5xl font-bold text-white tracking-tight">RewardRank</h1>
        <p className="mt-2 text-gray-400 text-lg">Fair Rewards. Smarter Rankings.</p>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">

        {/* Transaction Form */}
        <Section title="Submit Transaction">
          <Input label="User ID" placeholder="e.g. user123" value={txUserId} onChange={e => setTxUserId(e.target.value)} />
          <Input label="Amount" type="number" placeholder="e.g. 500" value={txAmount} onChange={e => setTxAmount(e.target.value)} />
          <Input label="Transaction ID" placeholder="e.g. tx001" value={txId} onChange={e => setTxId(e.target.value)} />
          <button
            onClick={submitTransaction}
            className="w-full py-2.5 rounded-lg font-semibold text-white text-sm transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #FF4FA2, #ff80bf)" }}>
            Submit Transaction
          </button>
          <StatusMsg msg={txMsg} />
        </Section>

        {/* User Summary */}
        <Section title="User Summary">
          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 px-4 py-2 rounded-lg text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
              placeholder="Enter User ID"
              value={sumUserId}
              onChange={e => setSumUserId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchSummary()}
            />
            <button
              onClick={fetchSummary}
              className="px-5 py-2 rounded-lg font-semibold text-white text-sm transition-opacity hover:opacity-90"
              style={{ background: "#FF4FA2" }}>
              Lookup
            </button>
          </div>
          <StatusMsg msg={sumMsg} />
          {summary && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                ["Total Amount", `$${summary.totalAmount}`],
                ["Transactions", summary.transactionCount],
                ["Points", summary.points],
                ["Consistency Bonus", `+${summary.consistencyBonus}`],
                ["Rank Score", summary.rankScore],
              ].map(([label, val]) => (
                <div key={label} className="rounded-xl p-4"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className="text-xl font-bold text-white">{val}</p>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Leaderboard */}
        <Section title="Leaderboard">
          <button
            onClick={fetchRanking}
            className="mb-4 px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ background: "rgba(255,79,162,0.15)", color: "#FF4FA2", border: "1px solid rgba(255,79,162,0.3)" }}>
            Refresh
          </button>
          {rankLoading && <p className="text-gray-500 text-sm">Loading…</p>}
          {!rankLoading && ranking.length === 0 && (
            <p className="text-gray-600 text-sm">No users yet. Submit a transaction to get started.</p>
          )}
          <div className="space-y-3">
            {ranking.map(u => (
              <div key={u.userId} className="flex items-center justify-between px-5 py-4 rounded-xl"
                style={{
                  background: u.rank === 1 ? "rgba(255,79,162,0.1)" : "rgba(255,255,255,0.04)",
                  border: u.rank === 1 ? "1px solid rgba(255,79,162,0.3)" : "1px solid rgba(255,255,255,0.07)",
                }}>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold w-8"
                    style={{ color: u.rank === 1 ? "#FF4FA2" : u.rank === 2 ? "#ccc" : "#888" }}>
                    #{u.rank}
                  </span>
                  <span className="font-medium text-white">{u.userId}</span>
                </div>
                <span className="font-bold text-white">{u.score} <span className="text-xs text-gray-500">pts</span></span>
              </div>
            ))}
          </div>
        </Section>
      </main>
    </div>
  );
}
