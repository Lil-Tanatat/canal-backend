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

const TYPE_OPTIONS = ["ทั้งหมด", "electrical wiring", "waterworks", "appliances", "air_wiring"];
const TYPE_LABEL = {
  "electrical wiring": "ไฟฟ้า",
  "waterworks":        "ประปา",
  "appliances":        "เครื่องใช้ไฟฟ้า",
  "air_wiring":        "แอร์",
  "":                  "—",
};

function Badge({ text, color, bg }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 99,
      fontSize: 12, fontWeight: 600, color, background: bg,
      border: `1px solid ${color}33`,
    }}>{text}</span>
  );
}

// แปลง support ID (เช่น 2604300001) เป็นวันที่อ่านได้
function idToDate(id) {
  if (!id || id.length < 6) return id;
  const y = "20" + id.slice(0, 2);
  const m = id.slice(2, 4);
  const d = id.slice(4, 6);
  return `${d}/${m}/${y}`;
}

// ── Detail Modal ──────────────────────────────────────────────
function DetailModal({ record, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 14, padding: "28px 32px",
        maxWidth: 520, width: "90%", boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>รหัสการซ่อม: {record.ID}</div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>{record.Desc}</h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={detailBox}>
            <div style={detailLabel}>สถานที่</div>
            <div style={detailValue}>📍 {record.Place || "—"}</div>
          </div>
          <div style={detailBox}>
            <div style={detailLabel}>ประเภท</div>
            <div style={detailValue}>🔧 {TYPE_LABEL[record.Type] || record.Type || "—"}</div>
          </div>
          <div style={detailBox}>
            <div style={detailLabel}>วันที่</div>
            <div style={detailValue}>📅 {idToDate(record.ID)}</div>
          </div>
          <div style={detailBox}>
            <div style={detailLabel}>ผู้ดำเนินการ</div>
            <div style={detailValue}>👤 {record.ETC || "—"}</div>
          </div>
        </div>

        {record.Report && (
          <div style={{ marginBottom: 12 }}>
            <div style={detailLabel}>รายงานความเสียหาย</div>
            <div style={{ ...detailBox, marginTop: 4 }}>{record.Report}</div>
          </div>
        )}

        {record.repair_details && (
          <div style={{ marginBottom: 12 }}>
            <div style={detailLabel}>วิธีซ่อม / รายละเอียด</div>
            <div style={{ ...detailBox, marginTop: 4 }}>{record.repair_details}</div>
          </div>
        )}

        {record.Manual && (
          record.Manual.match(/\.(jpg|jpeg|png|gif|webp)$/i)
            ? <div>
                <div style={detailLabel}>รูปประกอบ</div>
                <img src={`http://localhost:3001${record.Manual}`} alt="รูปประกอบ"
                  style={{ width: "100%", maxHeight: 220, objectFit: "contain", borderRadius: 10, border: "1.5px solid #e2e8f0", marginTop: 6 }} />
              </div>
            : <div>
                <div style={detailLabel}>หมายเหตุ / คู่มือ</div>
                <div style={{ ...detailBox, marginTop: 4 }}>{record.Manual}</div>
              </div>
        )}
      </div>
    </div>
  );
}

const detailBox = {
  background: "#f8fafc", borderRadius: 8, padding: "10px 14px",
  fontSize: 14, color: "#1e293b",
};
const detailLabel = { fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 2 };
const detailValue = { fontSize: 14, fontWeight: 600, color: "#1e293b" };

// ── Main ──────────────────────────────────────────────────────
export default function RepairReport({ user, onBack }) {
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterType, setFilterType] = useState("ทั้งหมด");
  const [selected, setSelected] = useState(null);
  const [checked, setChecked]   = useState(new Set()); // ID ที่ติ๊กเลือก
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchRecords = () => {
    setLoading(true);
    api("/api/support")
      .then(res => res.json())
      .then(data => { setRecords(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchRecords(); }, []);

  const toggleCheck = (id) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (checked.size === filtered.length) {
      setChecked(new Set());
    } else {
      setChecked(new Set(filtered.map(r => r.ID)));
    }
  };

  const handleDeleteSelected = async () => {
    if (!checked.size) return;
    if (!window.confirm(`ลบ ${checked.size} รายการที่เลือก ใช่ไหม?`)) return;
    setDeleting(true);
    await Promise.all([...checked].map(id =>
      api(`/api/support/${id}`, { method: "DELETE" }).catch(() => {})
    ));
    setChecked(new Set());
    setDeleteMode(false);
    setDeleting(false);
    fetchRecords();
  };

  const filtered = records.filter(r => {
    const matchType   = filterType === "ทั้งหมด" || r.Type === filterType;
    const matchSearch = !search ||
      r.Desc?.includes(search) ||
      r.Place?.includes(search) ||
      r.ID?.includes(search) ||
      r.Report?.includes(search);
    return matchType && matchSearch;
  });

  const handlePrint = () => window.print();

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif" }}>

      {/* Header */}
      <div style={{
        background: "#fff", borderBottom: "1.5px solid #e2e8f0",
        padding: "0 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 60,
        position: "sticky", top: 0, zIndex: 50,
      }} className="no-print">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 16 }}>📋</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>รายงานการซ่อมบำรุง</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>ทั้งหมด {records.length} รายการ</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {deleteMode ? (<>
            <button onClick={handleDeleteSelected} disabled={!checked.size || deleting}
              style={{ background: checked.size ? "#dc2626" : "#e2e8f0", border: "none", borderRadius: 8,
                padding: "6px 14px", fontSize: 13, cursor: checked.size ? "pointer" : "not-allowed",
                color: checked.size ? "#fff" : "#94a3b8", fontWeight: 700 }}>
              {deleting ? "กำลังลบ..." : `🗑️ ลบ ${checked.size} รายการ`}
            </button>
            <button onClick={() => { setDeleteMode(false); setChecked(new Set()); }}
              style={{ background: "#f1f5f9", border: "1.5px solid #e2e8f0", borderRadius: 8,
                padding: "6px 14px", fontSize: 13, cursor: "pointer", color: "#475569", fontWeight: 600 }}>
              ยกเลิก
            </button>
          </>) : (<>
            <button onClick={() => setDeleteMode(true)} style={{
              background: "#fff5f5", border: "1.5px solid #fca5a5", borderRadius: 8,
              padding: "6px 14px", fontSize: 13, cursor: "pointer", color: "#dc2626", fontWeight: 700,
            }}>🗑️ ลบรายการ</button>
            <button onClick={handlePrint} style={{
              background: "#f0fdf4", border: "1.5px solid #16a34a", borderRadius: 8,
              padding: "6px 14px", fontSize: 13, cursor: "pointer", color: "#16a34a", fontWeight: 700,
            }}>🖨️ พิมพ์</button>
            <button onClick={onBack} style={{
              background: "#f1f5f9", border: "1.5px solid #e2e8f0", borderRadius: 8,
              padding: "6px 14px", fontSize: 13, cursor: "pointer", color: "#475569", fontWeight: 600,
            }}>← กลับ</button>
          </>)}
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px" }}>

        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }} className="no-print">
          {[
            { label: "ทั้งหมด",       value: records.length,                                          color: "#1e40af", bg: "#eff6ff" },
            { label: "ไฟฟ้า",         value: records.filter(r => r.Type === "electrical wiring").length, color: "#d97706", bg: "#fef3c7" },
            { label: "ประปา",         value: records.filter(r => r.Type === "waterworks").length,       color: "#0891b2", bg: "#e0f2fe" },
            { label: "เครื่องใช้ไฟฟ้า", value: records.filter(r => r.Type === "appliances").length,    color: "#7c3aed", bg: "#f5f3ff" },
          ].map(s => (
            <div key={s.label} style={{
              background: s.bg, border: `1.5px solid ${s.color}33`,
              borderRadius: 12, padding: "14px 18px",
            }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }} className="no-print">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหา รหัส / ชื่อ / สถานที่ / รายงาน..."
            style={{
              flex: 1, minWidth: 200, padding: "9px 14px",
              border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14,
              fontFamily: "inherit", outline: "none", color: "#1e293b", background: "#fff",
            }}
          />
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{
            padding: "9px 14px", border: "1.5px solid #e2e8f0", borderRadius: 8,
            fontSize: 14, fontFamily: "inherit", color: "#475569", background: "#fff", cursor: "pointer",
          }}>
            {TYPE_OPTIONS.map(t => (
              <option key={t} value={t}>{t === "ทั้งหมด" ? "ทุกประเภท" : TYPE_LABEL[t] || t}</option>
            ))}
          </select>
        </div>

        {/* Print header — แสดงเฉพาะตอนพิมพ์ */}
        <div className="print-only" style={{ display: "none", marginBottom: 20 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>รายงานการซ่อมบำรุง — Hotel Maintenance</h2>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
            พิมพ์เมื่อ: {new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
            &nbsp;· ทั้งหมด {filtered.length} รายการ
          </p>
          <hr style={{ margin: "12px 0", borderColor: "#e2e8f0" }} />
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 14 }}>
            กำลังโหลดข้อมูล...
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                    {deleteMode && (
                      <th style={{ padding: "12px 14px" }}>
                        <input type="checkbox"
                          checked={checked.size === filtered.length && filtered.length > 0}
                          onChange={toggleAll}
                          style={{ width: 16, height: 16, cursor: "pointer" }} />
                      </th>
                    )}
                    {["วันที่", "รหัส", "รายการ", "สถานที่", "ประเภท", "รายงาน", "ผู้ดำเนินการ", ""].map(h => (
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
                      <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                        ไม่พบรายการ
                      </td>
                    </tr>
                  )}
                  {filtered.map((r, idx) => (
                    <tr key={r.ID} style={{
                      borderBottom: idx < filtered.length - 1 ? "1px solid #f1f5f9" : "none",
                      background: checked.has(r.ID) ? "#fff5f5" : idx % 2 === 0 ? "#fff" : "#fafafa",
                    }}>
                      {deleteMode && (
                        <td style={{ padding: "12px 14px" }}>
                          <input type="checkbox" checked={checked.has(r.ID)} onChange={() => toggleCheck(r.ID)}
                            style={{ width: 16, height: 16, cursor: "pointer" }} />
                        </td>
                      )}
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                        {idToDate(r.ID)}
                      </td>
                      <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 11, color: "#94a3b8" }}>
                        {r.ID}
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: 600, color: "#1e293b", maxWidth: 180 }}>
                        {r.Desc}
                      </td>
                      <td style={{ padding: "12px 14px", color: "#64748b", whiteSpace: "nowrap" }}>
                        {r.Place}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {r.Type ? (
                          <Badge
                            text={TYPE_LABEL[r.Type] || r.Type}
                            color="#1e40af" bg="#eff6ff"
                          />
                        ) : <span style={{ color: "#cbd5e1", fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 14px", color: "#475569", maxWidth: 200, fontSize: 13 }}>
                        {r.Report
                          ? r.Report.length > 40 ? r.Report.slice(0, 40) + "..." : r.Report
                          : <span style={{ color: "#cbd5e1" }}>—</span>
                        }
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#64748b" }}>
                        {r.ETC || "—"}
                      </td>
                      <td style={{ padding: "12px 14px" }} className="no-print">
                        <button onClick={() => setSelected(r)} style={{
                          padding: "5px 12px", borderRadius: 6, border: "1.5px solid #e2e8f0",
                          background: "#fff", fontSize: 12, cursor: "pointer", color: "#475569", fontWeight: 600,
                        }}>
                          ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", fontSize: 12, color: "#94a3b8" }}>
              แสดง {filtered.length} จาก {records.length} รายการ
            </div>
          </div>
        )}
      </div>

      {selected && <DetailModal record={selected} onClose={() => setSelected(null)} />}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; }
        }
        * { box-sizing: border-box; }
        input:focus, select:focus { border-color: #1e40af !important; outline: none; }
      `}</style>
    </div>
  );
}
