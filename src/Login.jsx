import { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
      } else {
        localStorage.setItem("token", data.token);
        onLogin(data.user);
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อ server ได้");
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", background: "#f8fafc",
      fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "40px 36px",
        width: 340, boxShadow: "0 4px 32px rgba(0,0,0,0.10)",
        border: "1.5px solid #e2e8f0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: "#1e40af",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 20 }}>🔧</span>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Hotel Maintenance</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>เข้าสู่ระบบ</div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
            Username
          </label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="กรอก username"
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
            Password
          </label>
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="กรอก password"
            type="password"
            style={inputStyle}
          />
        </div>

        {error && (
          <div style={{
            background: "#fee2e2", border: "1px solid #fca5a5",
            borderRadius: 8, padding: "8px 12px", marginTop: 10,
            fontSize: 13, color: "#dc2626",
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", marginTop: 20, padding: "12px",
            borderRadius: 8, background: loading ? "#93c5fd" : "#1e40af",
            color: "#fff", border: "none", fontSize: 15,
            fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  boxSizing: "border-box", border: "1.5px solid #e2e8f0",
  fontSize: 14, fontFamily: "inherit", outline: "none", color: "#1e293b",
};
