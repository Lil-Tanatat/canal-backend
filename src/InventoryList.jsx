import { useState, useEffect } from "react";

const api = (path, options = {}) =>
  fetch(`http://localhost:3001${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      ...options.headers,
    },
  });

const CONDITION_LABEL = { New: "ใหม่", Used: "เคยใช้แล้ว", Damaged: "เสีย", "": "—" };
const CONDITION_COLOR = { New: "#0891b2", Used: "#16a34a", Damaged: "#dc2626", "": "#94a3b8" };
const CONDITION_BG    = { New: "#e0f2fe", Used: "#dcfce7", Damaged: "#fee2e2", "": "#f1f5f9" };

function ConditionBadge({ value }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 99,
      fontSize: 12, fontWeight: 600,
      color: CONDITION_COLOR[value] || "#94a3b8",
      background: CONDITION_BG[value] || "#f1f5f9",
      border: `1px solid ${CONDITION_COLOR[value] || "#94a3b8"}33`,
    }}>
      {CONDITION_LABEL[value] || value || "—"}
    </span>
  );
}

// ── Detail Modal ──────────────────────────────────────────────
function DetailModal({ item, type, onClose }) {
  const isPart = type === "parts";
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 14, padding: "28px 32px",
        maxWidth: 480, width: "90%", boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>รหัส: {item.ID}</div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>{item.Desc}</h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>✕</button>
        </div>

        {item.Picture && (
          <div style={{ marginBottom: 16, textAlign: "center" }}>
            <img src={`http://localhost:3001${item.Picture}`} alt={item.Desc}
              style={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 10, border: "1.5px solid #e2e8f0" }} />
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div style={box}>
            <div style={lbl}>ราคา</div>
            <div style={val}>฿{Number(item.Price).toLocaleString()}</div>
          </div>
          <div style={box}>
            <div style={lbl}>สภาพ</div>
            <ConditionBadge value={isPart ? item.part_condition : item.tool_condition} />
          </div>
          <div style={box}>
            <div style={lbl}>สถานที่เก็บ</div>
            <div style={val}>📦 {item.place || "—"}</div>
          </div>
          <div style={box}>
            <div style={lbl}>{isPart ? "ร้านค้าอะไหล่" : "ร้านค้าอุปกรณ์"}</div>
            <div style={val}>🏪 {isPart ? item.part_store : item.tool_store || "—"}</div>
          </div>
          <div style={box}>
            <div style={lbl}>วันที่ซื้อ</div>
            <div style={val}>
              {item.Date_of_Buy
                ? new Date(item.Date_of_Buy).toLocaleDateString("th-TH")
                : "—"}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
          <div style={{ ...box, textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#16a34a" }}>{item.qty_new || 0}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>ใหม่</div>
          </div>
          <div style={{ ...box, textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#d97706" }}>{item.qty_used || 0}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>ใช้แล้ว</div>
          </div>
          <div style={{ ...box, textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#dc2626" }}>{item.qty_damaged || 0}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>เสีย</div>
          </div>
        </div>
        {item.ETC && (
          <div style={box}>
            <div style={lbl}>หมายเหตุ</div>
            <div style={{ fontSize: 14, color: "#475569", marginTop: 4 }}>{item.ETC}</div>
          </div>
        )}
      </div>
    </div>
  );
}

const box = { background: "#f8fafc", borderRadius: 8, padding: "10px 14px" };
const lbl = { fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 4 };
const val = { fontSize: 14, fontWeight: 600, color: "#1e293b" };

// ── List Component ────────────────────────────────────────────
function ItemList({ type, user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCond, setFilterCond] = useState("ทั้งหมด");
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  const conditionKey = type === "parts" ? "part_condition" : "tool_condition";

  const showToast = (msg, color = "#16a34a") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2500);
  };

  const handleConditionChange = async (item, newCondition) => {
    const field = type === "parts" ? "part_condition" : "tool_condition";
    const body = { ...item, [field]: newCondition, Picture: item.Picture || "" };
    const res = await api(`/api/${type}/${item.ID}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setItems(prev => prev.map(i => i.ID === item.ID ? { ...i, [field]: newCondition } : i));
      const label = { New: "ใหม่", Used: "เคยใช้แล้ว", Damaged: "เสีย" }[newCondition];
      showToast(`อัปเดตสภาพ "${item.Desc}" เป็น ${label} เรียบร้อย`);
    } else {
      showToast("เกิดข้อผิดพลาด", "#dc2626");
    }
  };

  useEffect(() => {
    setLoading(true);
    api(`/api/${type}`)
      .then(res => res.json())
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [type]);

  const filtered = items.filter(i => {
    const matchCond = filterCond === "ทั้งหมด" ||
      (filterCond === "New"     && (parseInt(i.qty_new)     || 0) > 0) ||
      (filterCond === "Used"    && (parseInt(i.qty_used)    || 0) > 0) ||
      (filterCond === "Damaged" && (parseInt(i.qty_damaged) || 0) > 0);
    const matchSearch = !search ||
      i.ID?.includes(search) ||
      i.Desc?.includes(search) ||
      i.place?.includes(search);
    return matchCond && matchSearch;
  });

  const counts = {
    New:     items.reduce((s, i) => s + (parseInt(i.qty_new) || 0), 0),
    Used:    items.reduce((s, i) => s + (parseInt(i.qty_used) || 0), 0),
    Damaged: items.reduce((s, i) => s + (parseInt(i.qty_damaged) || 0), 0),
  };

  return (
    <div>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { key: "New",     label: "ใหม่",        icon: "✅" },
          { key: "Used",    label: "กำลังใช้งาน", icon: "✅" },
          { key: "Damaged", label: "เสีย",         icon: "❌" },
        ].map(s => (
          <div key={s.key}
            onClick={() => setFilterCond(filterCond === s.key ? "ทั้งหมด" : s.key)}
            style={{
              background: filterCond === s.key ? CONDITION_BG[s.key] : "#fff",
              border: `1.5px solid ${filterCond === s.key ? CONDITION_COLOR[s.key] : "#e2e8f0"}`,
              borderRadius: 12, padding: "14px 16px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10, transition: "all .15s",
            }}>
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: CONDITION_COLOR[s.key] }}>{counts[s.key]}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="ค้นหา รหัส / ชื่อ / สถานที่เก็บ..."
        style={{
          width: "100%", boxSizing: "border-box", padding: "9px 14px", marginBottom: 14,
          border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14,
          fontFamily: "inherit", outline: "none", color: "#1e293b", background: "#fff",
        }}
      />

      {/* Loading */}
      {loading && <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>กำลังโหลด...</div>}

      {/* Table */}
      {!loading && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                  {["รหัส", "ชื่อ / รายละเอียด", "ราคา", "สถานที่เก็บ", "ร้านค้า", "สภาพ", ""].map(h => (
                    <th key={h} style={{
                      padding: "12px 14px", textAlign: "left", fontWeight: 700,
                      color: "#475569", fontSize: 12, whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                      ไม่พบรายการ
                    </td>
                  </tr>
                )}
                {filtered.map((item, idx) => (
                  <tr key={item.ID + idx} style={{
                    borderBottom: idx < filtered.length - 1 ? "1px solid #f1f5f9" : "none",
                    background: idx % 2 === 0 ? "#fff" : "#fafafa",
                  }}>
                    <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>
                      {item.ID}
                    </td>
                    <td style={{ padding: "8px 14px" }}>
                      {item.Picture
                        ? <img src={`http://localhost:3001${item.Picture}`} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8, display: "block" }} />
                        : <div style={{ width: 40, height: 40, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#cbd5e1" }}>📦</div>
                      }
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: 600, color: "#1e293b" }}>
                      {item.Desc}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#475569", whiteSpace: "nowrap" }}>
                      ฿{Number(item.Price).toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>
                      {item.place || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>
                      {type === "parts" ? item.part_store : item.tool_store || "—"}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12 }}>
                        {(parseInt(item.qty_new) || 0) > 0 && <span style={{ color: "#16a34a", fontWeight: 600 }}>✅ ใหม่ {item.qty_new}</span>}
                        {(parseInt(item.qty_used) || 0) > 0 && <span style={{ color: "#16a34a", fontWeight: 600 }}>✅ กำลังใช้งาน {item.qty_used}</span>}
                        {(parseInt(item.qty_damaged) || 0) > 0 && <span style={{ color: "#dc2626", fontWeight: 600 }}>❌ เสีย {item.qty_damaged}</span>}
                        {!parseInt(item.qty_new) && !parseInt(item.qty_used) && !parseInt(item.qty_damaged) && <span style={{ color: "#cbd5e1" }}>—</span>}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <button onClick={() => setSelected(item)} style={{
                        padding: "5px 12px", borderRadius: 6,
                        border: "1.5px solid #e2e8f0", background: "#fff",
                        fontSize: 12, cursor: "pointer", color: "#475569", fontWeight: 600,
                      }}>
                        รายละเอียด
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", fontSize: 12, color: "#94a3b8" }}>
            แสดง {filtered.length} จาก {items.length} รายการ
          </div>
        </div>
      )}

      {selected && <DetailModal item={selected} type={type} onClose={() => setSelected(null)} />}
    {toast && (
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 200, background: toast.color, color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
        {toast.msg}
      </div>
    )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
const TABS = [
  { key: "parts", label: "🔩 อะไหล่" },
  { key: "tools", label: "🔧 อุปกรณ์" },
];

export default function InventoryList({ user, onBack }) {
  const [activeTab, setActiveTab] = useState("parts");

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif" }}>

      {/* Header */}
      <div style={{
        background: "#fff", borderBottom: "1.5px solid #e2e8f0",
        padding: "0 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 60,
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 16 }}>📦</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>คลังอะไหล่ / อุปกรณ์</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>ดูรายการทั้งหมด</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#64748b" }}>
            {user.username} · <strong style={{ color: "#1e40af" }}>{user.role}</strong>
          </span>
          <button onClick={onBack} style={{
            background: "#f1f5f9", border: "1.5px solid #e2e8f0", borderRadius: 8,
            padding: "6px 14px", fontSize: 13, cursor: "pointer", color: "#475569", fontWeight: 600,
          }}>
            ← กลับ
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px" }}>

        {/* Tabs */}
        <div style={{
          display: "flex", background: "#fff",
          border: "1.5px solid #e2e8f0", borderRadius: 12,
          overflow: "hidden", marginBottom: 24,
        }}>
          {TABS.map((tab, i) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              flex: 1, padding: "14px 8px", border: "none",
              borderRight: i < TABS.length - 1 ? "1.5px solid #e2e8f0" : "none",
              background: activeTab === tab.key ? "#1e40af" : "#fff",
              color: activeTab === tab.key ? "#fff" : "#64748b",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              transition: "all .15s", fontFamily: "inherit",
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        <ItemList key={activeTab} type={activeTab} user={user} />
      </div>

      <style>{`* { box-sizing: border-box; } input:focus { border-color: #1e40af !important; outline: none; }`}</style>
    </div>
  );
}
