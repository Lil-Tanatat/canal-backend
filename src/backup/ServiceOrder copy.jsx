import { useState, useEffect } from "react";

const api = (path, options = {}) => {
  const isFormData = options.body instanceof FormData;
  return fetch(`http://localhost:3001${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      ...options.headers,
    },
  });
};

const STATE_CONFIG = {
  ok:             { label: "ปกติ",       color: "#16a34a", bg: "#dcfce7", next: "broken",          action: "แจ้งซ่อม",       role: ["พนักงาน", "แอดมิน"] },
  broken:         { label: "พัง",         color: "#dc2626", bg: "#fee2e2", next: "wait_for_repair",  action: "รับงานซ่อม",    role: ["ช่าง", "แอดมิน"] },
  wait_for_repair:{ label: "กำลังซ่อม",  color: "#d97706", bg: "#fef3c7", next: "ok",              action: "ซ่อมเสร็จแล้ว", role: ["ช่าง", "แอดมิน"] },
};

const ROLES = ["พนักงาน", "ช่าง", "แอดมิน"];
const ITEM_TYPES = ["ทั้งหมด", "ไฟฟ้า", "ประปา", "เครื่องใช้ไฟฟ้า", "โครงสร้าง"];

const selectStyle = {
  padding: "9px 14px", border: "1.5px solid #e2e8f0", borderRadius: 8,
  fontSize: 14, fontFamily: "inherit", color: "#475569", background: "#fff", cursor: "pointer",
};

function btnStyle(bg, color) {
  return {
    padding: "9px 20px", borderRadius: 8, border: "none",
    background: bg, color, fontSize: 14, fontWeight: 600,
    cursor: "pointer", transition: "opacity .15s",
  };
}

function StateBadge({ state }) {
  const cfg = STATE_CONFIG[state];
  if (!cfg) return null;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 99,
      fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}33`, letterSpacing: 0.2,
    }}>
      {cfg.label}
    </span>
  );
}

function ConfirmModal({ item, nextState, onConfirm, onCancel }) {
  const [note, setNote]           = useState("");
  const [qty, setQty]             = useState(1);
  const [damage, setDamage]       = useState(""); // รายละเอียดความเสียหาย
  const [repairDetail, setRepairDetail] = useState(""); // วิธีซ่อม
  const [photo, setPhoto]         = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [reportData, setReportData] = useState(null); // ข้อมูลจาก support log (ตอนช่างรับงาน)

  const cfg = STATE_CONFIG[item.State];
  const isReporting     = nextState === "broken";        // พนักงานแจ้งซ่อม
  const isAccepting     = nextState === "wait_for_repair"; // ช่างรับงาน
  const isDone          = nextState === "ok";             // ช่างซ่อมเสร็จ

  const maxQty = isReporting
    ? (parseInt(item.qty_new) || 0) + (parseInt(item.qty_used) || 0)
    : isDone ? (parseInt(item.qty_damaged) || 0) : 0;

  // ตอนช่างรับงาน ดึง support log ล่าสุดมาแสดง
  useState(() => {
    if (isAccepting) {
      fetch(`http://localhost:3001/api/support?search=${encodeURIComponent(item.Desc)}&limit=1`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      }).then(r => r.json()).then(data => {
        if (data.length) setReportData(data[0]);
      }).catch(() => {});
    }
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleConfirm = () => {
    if ((isReporting || isDone) && (qty < 1 || qty > maxQty)) return;
    onConfirm({ note, qty: parseInt(qty) || 0, damage, repairDetail, photo });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
      overflowY: "auto", padding: "20px 0",
    }}>
      <div style={{
        background: "#fff", borderRadius: 14, padding: "28px 32px",
        maxWidth: 480, width: "90%", boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        margin: "auto",
      }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#1e293b" }}>{cfg.action}</h3>
        <p style={{ margin: "0 0 14px", fontSize: 14, color: "#64748b" }}>
          <strong>{item.Desc}</strong> — {item.Place}
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
          <StateBadge state={item.State} />
          <span style={{ color: "#94a3b8", fontSize: 13 }}>→</span>
          <StateBadge state={nextState} />
        </div>

        {/* แสดงจำนวนปัจจุบัน */}
        <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, display: "flex", gap: 14 }}>
          <span style={{ color: "#0891b2", fontWeight: 600 }}>🆕 {item.qty_new || 0}</span>
          <span style={{ color: "#16a34a", fontWeight: 600 }}>✅ {item.qty_used || 0}</span>
          <span style={{ color: "#dc2626", fontWeight: 600 }}>❌ {item.qty_damaged || 0}</span>
        </div>

        {/* ═══ พนักงานแจ้งซ่อม ═══ */}
        {isReporting && (<>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>จำนวนที่เสีย * <span style={{ color: "#94a3b8", fontWeight: 400 }}>(สูงสุด {maxQty} ชิ้น)</span></label>
            <input type="number" min={1} max={maxQty} value={qty} onChange={e => setQty(e.target.value)}
              style={{ width: 90, padding: "9px 12px", borderRadius: 8, fontSize: 15, fontWeight: 700,
                border: `1.5px solid ${qty < 1 || qty > maxQty ? "#dc2626" : "#e2e8f0"}`, outline: "none", textAlign: "center" }} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>รายละเอียดความเสียหาย</label>
            <textarea value={damage} onChange={e => setDamage(e.target.value)}
              placeholder="อธิบายความเสียหายที่พบ..." rows={3} style={taStyle} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>รูปของที่เสีย (ไม่บังคับ)</label>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div style={{ width: 72, height: 72, borderRadius: 10, border: "2px dashed #e2e8f0",
                background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", flexShrink: 0 }}>
                {photoPreview
                  ? <img src={photoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 24, color: "#cbd5e1" }}>📷</span>}
              </div>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>คลิกเพื่อเลือกรูป</span>
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
            </label>
          </div>
        </>)}

        {/* ═══ ช่างรับงาน — ดูรายละเอียดที่แจ้งไว้ ═══ */}
        {isAccepting && (
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>รายละเอียดจากผู้แจ้ง</div>
            {reportData ? (<>
              {reportData.Type && <div style={{ fontSize: 13, color: "#475569", marginBottom: 6 }}>🔧 ประเภท: <strong>{reportData.Type}</strong></div>}
              {reportData.Report && <div style={{ fontSize: 13, color: "#475569", marginBottom: 6 }}>📋 ความเสียหาย: {reportData.Report}</div>}
              {reportData.Picture && (
                <img src={`http://localhost:3001${reportData.Picture}`} alt="รูปความเสียหาย"
                  style={{ width: "100%", maxHeight: 180, objectFit: "contain", borderRadius: 8, marginTop: 8, border: "1px solid #e2e8f0" }} />
              )}
            </>) : <div style={{ fontSize: 13, color: "#94a3b8" }}>ไม่พบรายละเอียด</div>}
          </div>
        )}

        {/* ═══ ช่างซ่อมเสร็จ ═══ */}
        {isDone && (<>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>จำนวนที่ซ่อมได้ * <span style={{ color: "#94a3b8", fontWeight: 400 }}>(สูงสุด {maxQty} ชิ้น)</span></label>
            <input type="number" min={1} max={maxQty} value={qty} onChange={e => setQty(e.target.value)}
              style={{ width: 90, padding: "9px 12px", borderRadius: 8, fontSize: 15, fontWeight: 700,
                border: `1.5px solid ${qty < 1 || qty > maxQty ? "#dc2626" : "#e2e8f0"}`, outline: "none", textAlign: "center" }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>วิธีซ่อม / รายละเอียด</label>
            <textarea value={repairDetail} onChange={e => setRepairDetail(e.target.value)}
              placeholder="อธิบายวิธีการซ่อมที่ทำ..." rows={3} style={taStyle} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>รูปหลังซ่อม (ไม่บังคับ)</label>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div style={{ width: 72, height: 72, borderRadius: 10, border: "2px dashed #e2e8f0",
                background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", flexShrink: 0 }}>
                {photoPreview
                  ? <img src={photoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 24, color: "#cbd5e1" }}>📷</span>}
              </div>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>คลิกเพื่อเลือกรูป</span>
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
            </label>
          </div>
        </>)}

        {/* note ทุก step */}
        <div style={{ marginBottom: 4 }}>
          <label style={lbl}>หมายเหตุเพิ่มเติม (ไม่บังคับ)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="" rows={2} style={taStyle} />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={btnStyle("#f1f5f9", "#475569")}>ยกเลิก</button>
          <button onClick={handleConfirm}
            disabled={(isReporting || isDone) && (qty < 1 || qty > maxQty)}
            style={btnStyle(
              (isReporting || isDone) && (qty < 1 || qty > maxQty) ? "#e2e8f0" : (STATE_CONFIG[nextState]?.color || "#1e40af"),
              (isReporting || isDone) && (qty < 1 || qty > maxQty) ? "#94a3b8" : "#fff"
            )}>
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
}

const lbl = { fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 };
const selStyle = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, fontFamily: "inherit", outline: "none", background: "#fff" };
const taStyle = { width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontFamily: "inherit", resize: "vertical", color: "#1e293b", outline: "none" };

function HistoryDrawer({ logs, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
      display: "flex", justifyContent: "flex-end", zIndex: 100,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", width: 360, maxWidth: "100%", height: "100%",
        overflowY: "auto", padding: "28px 24px", boxShadow: "-4px 0 30px rgba(0,0,0,0.12)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>ประวัติการเปลี่ยนสถานะ</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>✕</button>
        </div>
        {logs.length === 0 && <p style={{ color: "#94a3b8", fontSize: 14 }}>ยังไม่มีประวัติ</p>}
        {logs.map((l, i) => (
          <div key={i} style={{ borderLeft: "3px solid #e2e8f0", paddingLeft: 14, marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>{l.timestamp}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>{l.desc} — {l.place}</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
              <StateBadge state={l.from} />
              <span style={{ color: "#94a3b8", fontSize: 12 }}>→</span>
              <StateBadge state={l.to} />
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>โดย: <strong>{l.by}</strong> ({l.role})</div>
            {l.note && <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>หมายเหตุ: {l.note}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ServiceOrder({ user, onLogout, onAdmin, onReport, onInventory }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterState, setFilterState] = useState("ทั้งหมด");
  const [filterType, setFilterType] = useState("ทั้งหมด");
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState(null);

  const role = user.role;

  useEffect(() => {
    api("/api/stuff")
      .then(res => res.json())
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const showToast = (msg, color = "#16a34a") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2500);
  };

  const handleAction = (item) => {
    const cfg = STATE_CONFIG[item.State];
    // พนักงานกดตอน broken → แจ้งซ่อมเพิ่ม
    if (item.State === "broken" && cfg.altRole?.includes(role)) {
      setConfirm({ item, nextState: cfg.altNext });
      return;
    }
    if (!cfg.role.includes(role)) {
      showToast(`Role "${role}" ไม่มีสิทธิ์ดำเนินการนี้`, "#dc2626");
      return;
    }
    setConfirm({ item, nextState: cfg.next });
  };

  const handleConfirm = ({ note, qty, damage, repairDetail, photo }) => {
    const { item, nextState } = confirm;
    const now = new Date();
    const ts = `${now.toLocaleDateString("th-TH")} ${now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}`;
    setConfirm(null);

    const fd = new FormData();
    fd.append("state",        nextState);
    fd.append("note",         note || "");
    fd.append("qty",          qty || 0);
    fd.append("damage",       damage || "");
    fd.append("repairDetail", repairDetail || "");
    if (photo) fd.append("photo", photo);

    api(`/api/stuff/${item.ID}/state`, { method: "PATCH", body: fd })
      .then(res => res.json())
      .then(data => {
        if (data.error) { showToast(data.error, "#dc2626"); return; }
        setItems(prev => prev.map(i => i.ID === item.ID ? {
          ...i,
          State:       data.newState ?? nextState,
          qty_new:     data.qty_new     ?? i.qty_new,
          qty_used:    data.qty_used    ?? i.qty_used,
          qty_damaged: data.qty_damaged ?? i.qty_damaged,
        } : i));
        setLogs(prev => [{ timestamp: ts, desc: item.Desc, place: item.Place, from: item.State, to: nextState, by: user.username, role, note }, ...prev]);
        showToast(`อัปเดตสถานะ "${item.Desc}" เรียบร้อย`);
      })
      .catch(() => showToast("เกิดข้อผิดพลาด กรุณาลองใหม่", "#dc2626"));
  };

  const filtered = items.filter(i => {
    const matchState  = filterState === "ทั้งหมด" || i.State === filterState;
    const matchType   = filterType  === "ทั้งหมด" || i.Itemtype === filterType;
    const matchSearch = !search || i.Desc?.includes(search) || i.Place?.includes(search) || i.ID?.includes(search);
    return matchState && matchType && matchSearch;
  });

  const counts = {
    ok:             items.filter(i => i.State === "ok").length,
    broken:         items.filter(i => i.State === "broken").length,
    wait_for_repair:items.filter(i => i.State === "wait_for_repair").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif" }}>

      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 200,
          background: toast.color, color: "#fff", padding: "12px 20px",
          borderRadius: 10, fontSize: 14, fontWeight: 600,
          boxShadow: "0 4px 20px rgba(0,0,0,0.18)", animation: "fadeIn .2s ease",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{
        background: "#fff", borderBottom: "1.5px solid #e2e8f0",
        padding: "0 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 60,
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 16 }}>🔧</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>Hotel Maintenance</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>ระบบสั่งซ่อม</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setShowHistory(true)} style={{
            background: "#f1f5f9", border: "none", borderRadius: 8,
            padding: "7px 14px", fontSize: 13, cursor: "pointer", color: "#475569", fontWeight: 600,
          }}>
            ประวัติ ({logs.length})
          </button>
          {/* ปุ่มคลังอะไหล่ */}
          <button onClick={onInventory} style={{
            background: "#f0fdf4", border: "1.5px solid #16a34a", borderRadius: 8,
            padding: "6px 14px", fontSize: 13, cursor: "pointer", color: "#16a34a", fontWeight: 700,
          }}>
            📦 คลังอะไหล่
          </button>
          {/* ปุ่มรายงานการซ่อม */}
          <button onClick={onReport} style={{
            background: "#eff6ff", border: "1.5px solid #1e40af", borderRadius: 8,
            padding: "6px 14px", fontSize: 13, cursor: "pointer", color: "#1e40af", fontWeight: 700,
          }}>
            📋 รายงานการซ่อม
          </button>
          {/* ปุ่ม Admin — แสดงเฉพาะ role แอดมิน */}
          {onAdmin && (
            <button onClick={onAdmin} style={{
              background: "#fef3c7", border: "1.5px solid #d97706", borderRadius: 8,
              padding: "6px 14px", fontSize: 13, cursor: "pointer", color: "#92400e", fontWeight: 700,
            }}>
              ⚙️ จัดการข้อมูล
            </button>
          )}
          <div style={{
            background: "#f1f5f9", borderRadius: 8, padding: "6px 14px",
            fontSize: 13, color: "#1e293b", fontWeight: 600,
          }}>
            {user.username} · <span style={{ color: "#1e40af" }}>{role}</span>
          </div>
          <button onClick={onLogout} style={{
            background: "none", border: "1.5px solid #e2e8f0", borderRadius: 8,
            padding: "6px 14px", fontSize: 13, cursor: "pointer", color: "#94a3b8",
          }}>
            ออกจากระบบ
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { key: "ok",              label: "ปกติ",      icon: "✅", ...STATE_CONFIG.ok },
            { key: "broken",          label: "พัง",        icon: "🔴", ...STATE_CONFIG.broken },
            { key: "wait_for_repair", label: "กำลังซ่อม", icon: "🔧", ...STATE_CONFIG.wait_for_repair },
          ].map(s => (
            <div key={s.key} onClick={() => setFilterState(filterState === s.key ? "ทั้งหมด" : s.key)}
              style={{
                background: filterState === s.key ? s.bg : "#fff",
                border: `1.5px solid ${filterState === s.key ? s.color : "#e2e8f0"}`,
                borderRadius: 12, padding: "16px 18px", cursor: "pointer",
                transition: "all .15s", display: "flex", alignItems: "center", gap: 12,
              }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{counts[s.key]}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>รายการ{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหา รหัส / ชื่อ / สถานที่..."
            style={{
              flex: 1, minWidth: 200, padding: "9px 14px",
              border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14,
              fontFamily: "inherit", outline: "none", color: "#1e293b",
            }}
          />
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={selectStyle}>
            {ITEM_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 14 }}>
            กำลังโหลดข้อมูล...
          </div>
        )}

        {!loading && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                    {["รหัส", "รูป", "ประเภท", "ชื่อ / รายละเอียด", "สถานที่", "จำนวน", "สถานะ", ""].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#475569", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>ไม่พบรายการ</td></tr>
                  )}
                  {filtered.map((item, idx) => {
                    const cfg = STATE_CONFIG[item.State];
                    const canAct = cfg?.role.includes(role);
                    return (
                      <tr key={item.ID + idx} style={{
                        borderBottom: idx < filtered.length - 1 ? "1px solid #f1f5f9" : "none",
                        background: item.State === "broken" ? "#fff5f5" : item.State === "wait_for_repair" ? "#fffbeb" : "#fff",
                      }}>
                        <td style={{ padding: "13px 16px", fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>{item.ID}</td>
                        <td style={{ padding: "8px 16px" }}>
                          {item.Picture
                            ? <img src={`http://localhost:3001${item.Picture}`} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8, display: "block" }} />
                            : <div style={{ width: 40, height: 40, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#cbd5e1" }}>📦</div>
                          }
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <span style={{ background: "#f1f5f9", borderRadius: 6, padding: "2px 8px", fontSize: 12, color: "#475569", fontWeight: 600 }}>
                            {item.Itemtype}
                          </span>
                        </td>
                        <td style={{ padding: "13px 16px", fontWeight: 600, color: "#1e293b" }}>{item.Desc}</td>
                        <td style={{ padding: "13px 16px", color: "#64748b" }}>{item.Place}</td>
                        <td style={{ padding: "13px 16px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12 }}>
                            {item.qty_new > 0 && <span style={{ color: "#16a34a", fontWeight: 600 }}>✅ ใหม่ {item.qty_new}</span>}
                            {item.qty_used > 0 && <span style={{ color: "#16a34a", fontWeight: 600 }}>✅ กำลังใช้งาน {item.qty_used}</span>}
                            {item.qty_damaged > 0 && <span style={{ color: "#dc2626", fontWeight: 600 }}>❌ เสีย {item.qty_damaged}</span>}
                            {!item.qty_new && !item.qty_used && !item.qty_damaged && <span style={{ color: "#cbd5e1" }}>—</span>}
                          </div>
                        </td>
                        <td style={{ padding: "13px 16px" }}>{cfg && <StateBadge state={item.State} />}</td>
                        <td style={{ padding: "13px 16px" }}>
                          {canAct ? (
                            <button onClick={() => handleAction(item)} style={{
                              padding: "6px 14px", borderRadius: 7, border: "none",
                              background: cfg.color, color: "#fff",
                              fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                            }}>
                              {cfg.action}
                            </button>
                          ) : cfg.altRole?.includes(role) ? (
                            <button onClick={() => handleAction(item)} style={{
                              padding: "6px 14px", borderRadius: 7, border: "none",
                              background: "#dc2626", color: "#fff",
                              fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                            }}>
                              {cfg.altAction}
                            </button>
                          ) : (
                            <span style={{ fontSize: 12, color: "#cbd5e1" }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", fontSize: 12, color: "#94a3b8" }}>
              แสดง {filtered.length} จาก {items.length} รายการ · Role ปัจจุบัน: <strong style={{ color: "#1e40af" }}>{role}</strong>
            </div>
          </div>
        )}
      </div>

      {confirm && (
        <ConfirmModal
          item={confirm.item}
          nextState={confirm.nextState}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
      {showHistory && <HistoryDrawer logs={logs} onClose={() => setShowHistory(false)} />}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        * { box-sizing: border-box; }
        input:focus { border-color: #1e40af !important; box-shadow: 0 0 0 3px #1e40af22; }
        select:focus { border-color: #1e40af !important; outline: none; }
      `}</style>
    </div>
  );
}
