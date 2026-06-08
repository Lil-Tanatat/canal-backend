import { useState, useEffect } from "react";

const api = (path, options = {}) => {
  const isFormData = options.body instanceof FormData;
  return fetch(`http://localhost:3001${path}`, {
    ...options,
    headers: {
      // ถ้าเป็น FormData ไม่ต้อง set Content-Type เพราะ browser จะใส่ boundary ให้เอง
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      ...options.headers,
    },
  }).then(res => {
    if (res.status === 401) { localStorage.removeItem("token"); window.location.reload(); }
    return res;
  });
};

// ── ID Generator ─────────────────────────────────────────────
function genNextID(type, items) {
  const prefix = { stuff: "S001", tools: "T001", parts: "E001" }[type];
  const padLen  = type === "parts" ? 5 : 4;
  const next = (items.length ? Math.max(...items.map(i => parseInt(i.ID?.slice(4)) || 0)) : 0) + 1;
  return `${prefix}${String(next).padStart(padLen, "0")}`;
}

function isDuplicateID(id, items) {
  return items.some(i => i.ID === id);
}

function nowDateTimeLocal() {
  const d = new Date();
  return d.toISOString().slice(0, 16); // format สำหรับ datetime-local input
}

function GenBtn({ onClick }) {
  return (
    <button type="button" onClick={onClick} title="สร้างข้อมูลอัตโนมัติ" style={{
      padding: "9px 14px", borderRadius: 8, border: "1.5px solid #1e40af",
      background: "#eff6ff", cursor: "pointer", fontSize: 13, fontWeight: 700,
      color: "#1e40af", flexShrink: 0, whiteSpace: "nowrap",
    }}>🎲 Auto</button>
  );
}

const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 8, boxSizing: "border-box", border: "1.5px solid #e2e8f0", fontSize: 14, fontFamily: "inherit", outline: "none", color: "#1e293b", background: "#fff" };
const inputDisabled = { ...inputStyle, background: "#f8fafc", color: "#94a3b8" };
const labelStyle = { fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 };

function Field({ label, children }) { return <div style={{ marginBottom: 14 }}><label style={labelStyle}>{label}</label>{children}</div>; }
function Select({ value, onChange, options, disabled }) {
  return <select value={value} onChange={onChange} disabled={disabled} style={{ ...(disabled ? inputDisabled : inputStyle), cursor: disabled ? "not-allowed" : "pointer" }}>
    {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
  </select>;
}
function submitBtn(loading, isEdit) {
  return { marginTop: 8, padding: "11px 24px", borderRadius: 8, background: loading ? "#93c5fd" : isEdit ? "#d97706" : "#1e40af", color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" };
}
function Toast({ toast }) {
  if (!toast) return null;
  return <div style={{ position: "fixed", top: 20, right: 20, zIndex: 200, background: toast.color, color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>{toast.msg}</div>;
}

function ItemTable({ items, loading, columns, onEdit, onDelete }) {
  if (loading) return <div style={{ color: "#94a3b8", fontSize: 14, padding: "16px 0" }}>กำลังโหลด...</div>;
  if (!items.length) return <div style={{ color: "#94a3b8", fontSize: 14, padding: "16px 0" }}>ยังไม่มีรายการ</div>;
  return (
    <div style={{ overflowX: "auto", borderRadius: 10, border: "1.5px solid #e2e8f0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
          {columns.map(c => <th key={c.key} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#475569", whiteSpace: "nowrap" }}>{c.label}</th>)}
          <th style={{ padding: "10px 12px" }}></th>
        </tr></thead>
        <tbody>{items.map((item, idx) => (
          <tr key={item.ID + idx} style={{ borderBottom: idx < items.length - 1 ? "1px solid #f1f5f9" : "none" }}>
            {columns.map(c => <td key={c.key} style={{ padding: "10px 12px", color: "#475569", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.render ? c.render(item) : item[c.key] || "—"}</td>)}
            <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
              <button onClick={() => onEdit(item)} style={{ padding: "4px 10px", borderRadius: 6, border: "1.5px solid #d97706", background: "#fff", color: "#d97706", fontSize: 12, fontWeight: 600, cursor: "pointer", marginRight: 6 }}>แก้ไข</button>
              <button onClick={() => onDelete(item)} style={{ padding: "4px 10px", borderRadius: 6, border: "1.5px solid #fca5a5", background: "#fff", color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>ลบ</button>
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function EditBanner({ desc, onCancel }) {
  return (
    <div style={{ background: "#fef3c7", border: "1.5px solid #d97706", borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 13, color: "#92400e", fontWeight: 600 }}>
      ✏️ กำลังแก้ไข: {desc} &nbsp;
      <button onClick={onCancel} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontWeight: 700 }}>✕ ยกเลิก</button>
    </div>
  );
}

// ── Stuff Form ────────────────────────────────────────────────
const emptyStuff = { ID: "", Itemtype: "", Desc: "", Price: "", Place: "", Date_of_Buy: "", Date_of_Install: "", qty_new: 0, qty_used: 0, qty_damaged: 0, urgency: "medium", deadline: "", ETC: "" };
function StuffForm({ showToast }) {
  const [form, setForm] = useState(emptyStuff);
  const [picture, setPicture] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPicture(file); setPreview(URL.createObjectURL(file));
  };
  const fetchItems = () => { setLoadingItems(true); api("/api/stuff").then(r => r.json()).then(d => { setItems(d); setLoadingItems(false); }).catch(() => setLoadingItems(false)); };
  useEffect(() => { fetchItems(); }, []);
  const handleEdit = (item) => {
    setForm({ ID: item.ID, Itemtype: item.Itemtype || "", Desc: item.Desc, Price: item.Price, Place: item.Place, urgency: item.urgency || "medium", deadline: item.deadline ? item.deadline.slice(0,10) : "", ETC: item.ETC || "", Date_of_Buy: item.Date_of_Buy ? item.Date_of_Buy.slice(0, 16) : "", Date_of_Install: item.Date_of_Install ? item.Date_of_Install.slice(0, 16) : "", qty_new: item.qty_new || 0, qty_used: item.qty_used || 0, qty_damaged: item.qty_damaged || 0, Picture: item.Picture || "" });
    setPicture(null); setPreview(item.Picture ? `http://localhost:3001${item.Picture}` : null);
    setEditMode(true); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleCancel = () => { setForm(emptyStuff); setPicture(null); setPreview(null); setEditMode(false); };
  const handleDelete = async (item) => {
    if (!window.confirm(`ลบ "${item.Desc}" ใช่ไหม?`)) return;
    const res = await api(`/api/stuff/${item.ID}`, { method: "DELETE" });
    const d = await res.json();
    if (!res.ok) { showToast(d.error || "เกิดข้อผิดพลาด", "#dc2626"); return; }
    showToast(`ลบ "${item.Desc}" เรียบร้อย`); fetchItems();
  };
  const handleSubmit = async () => {
    if (!form.ID || !form.Desc || !form.Place) { showToast("กรุณากรอก ID, ชื่อ และสถานที่ให้ครบ", "#dc2626"); return; }
    if (!editMode && isDuplicateID(form.ID, items)) { showToast(`ID "${form.ID}" มีอยู่แล้ว กรุณาใช้ ID อื่น`, "#dc2626"); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries({ ...form, Date_of_Buy: form.Date_of_Buy || new Date().toISOString().slice(0,19).replace("T"," "), Date_of_Install: form.Date_of_Install || new Date().toISOString().slice(0,19).replace("T"," ") })
        .forEach(([k, v]) => fd.append(k, v ?? ""));
      if (picture) fd.append("picture", picture);
      const res = await api(editMode ? `/api/stuff/${form.ID}` : "/api/stuff", { method: editMode ? "PUT" : "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "เกิดข้อผิดพลาด");
      showToast(editMode ? `แก้ไข "${form.Desc}" สำเร็จ` : `เพิ่ม "${form.Desc}" สำเร็จ`);
      setForm(emptyStuff); setPicture(null); setPreview(null); setEditMode(false); fetchItems();
    } catch (e) { showToast(e.message, "#dc2626"); }
    setLoading(false);
  };
  return (
    <div>
      {editMode && <EditBanner desc={form.Desc} onCancel={handleCancel} />}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="รหัส (ID) *">
          <div style={{ display: "flex", gap: 6 }}>
            <input value={form.ID} onChange={e => set("ID", e.target.value)} disabled={editMode} placeholder="เช่น S0010001" style={editMode ? inputDisabled : inputStyle} />
            {!editMode && <GenBtn onClick={() => {
              const id = genNextID("stuff", items);
              const now = nowDateTimeLocal();
              setForm(f => ({ ...f, ID: id, place: "บ้านช่าง", Date_of_Buy: now, Date_of_Install: now }));
            }} />}
          </div>
        </Field>
        <Field label="ประเภท"><Select value={form.Itemtype} onChange={e => set("Itemtype", e.target.value)} options={["", "ไฟฟ้า", "ประปา", "เครื่องใช้ไฟฟ้า", "โครงสร้าง", "อื่นๆ"]} /></Field>
        <Field label="ชื่อ / รายละเอียด *"><input value={form.Desc} onChange={e => set("Desc", e.target.value)} placeholder="เช่น หลอดไฟห้อง 101" style={inputStyle} /></Field>
        <Field label="สถานที่ *"><input value={form.Place} onChange={e => set("Place", e.target.value)} placeholder="เช่น ห้อง 101" style={inputStyle} /></Field>
        <Field label="ราคา (บาท)"><input value={form.Price} onChange={e => set("Price", e.target.value)} placeholder="0" type="number" style={inputStyle} /></Field>
        <Field label="จำนวนใหม่"><input value={form.qty_new} onChange={e => set("qty_new", e.target.value)} type="number" min="0" placeholder="0" style={inputStyle} /></Field>
        <Field label="จำนวนใช้แล้ว"><input value={form.qty_used} onChange={e => set("qty_used", e.target.value)} type="number" min="0" placeholder="0" style={inputStyle} /></Field>
        <Field label="จำนวนเสีย"><input value={form.qty_damaged} onChange={e => set("qty_damaged", e.target.value)} type="number" min="0" placeholder="0" style={inputStyle} /></Field>
        <Field label="ความเร่งด่วน">
          <Select value={form.urgency} onChange={e => set("urgency", e.target.value)}
            options={[{ value: "low", label: "🟢 ไม่ด่วน" }, { value: "medium", label: "🟡 ด่วนเล็กน้อย" }, { value: "high", label: "🔴 เร่งด่วน" }]} />
        </Field>
        <Field label="กำหนดเสร็จ (deadline)">
          <input value={form.deadline} onChange={e => set("deadline", e.target.value)} type="date" style={inputStyle} />
        </Field>
        <Field label="วันที่ซื้อ"><input value={form.Date_of_Buy} onChange={e => set("Date_of_Buy", e.target.value)} type="datetime-local" style={inputStyle} /></Field>
        <Field label="วันที่ติดตั้ง"><input value={form.Date_of_Install} onChange={e => set("Date_of_Install", e.target.value)} type="datetime-local" style={inputStyle} /></Field>
      </div>
      <Field label="หมายเหตุ"><input value={form.ETC} onChange={e => set("ETC", e.target.value)} placeholder="(ไม่บังคับ)" style={inputStyle} /></Field>

      <Field label="รูปภาพ (ไม่บังคับ)">
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 100, height: 100, borderRadius: 10, border: "2px dashed #e2e8f0", cursor: "pointer", background: "#f8fafc", flexShrink: 0, overflow: "hidden" }}>
            {preview ? <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 28, color: "#cbd5e1" }}>📷</span>}
            <input type="file" accept="image/*" onChange={handlePictureChange} style={{ display: "none" }} />
          </label>
          <div style={{ fontSize: 12, color: "#94a3b8", paddingTop: 8 }}>
            คลิกที่กล่องเพื่อเลือกรูป<br/>รองรับ JPG, PNG ขนาดไม่เกิน 5MB
            {preview && <div><button type="button" onClick={() => { setPicture(null); setPreview(null); }} style={{ marginTop: 6, background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 12, padding: 0 }}>✕ ลบรูป</button></div>}
          </div>
        </div>
      </Field>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleSubmit} disabled={loading} style={submitBtn(loading, editMode)}>{loading ? "กำลังบันทึก..." : editMode ? "💾 บันทึกการแก้ไข" : "➕ เพิ่มรายการ"}</button>
        {editMode && <button onClick={handleCancel} style={{ padding: "11px 20px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 14, cursor: "pointer", color: "#475569" }}>ยกเลิก</button>}
      </div>
      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>รายการทั้งหมด ({items.length})</div>
        <ItemTable items={items} loading={loadingItems}
          columns={[
            { key: "ID", label: "รหัส" },
            { key: "Picture", label: "รูป", render: i => i.Picture ? <img src={`http://localhost:3001${i.Picture}`} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6 }} /> : <span style={{ color: "#cbd5e1" }}>—</span> },
            { key: "Desc", label: "ชื่อ" },
            { key: "Place", label: "สถานที่" },
            { key: "State", label: "สถานะ", render: i => ({ ok: "ปกติ", broken: "พัง", wait_for_repair: "กำลังซ่อม" }[i.State] || i.State) },
            { key: "urgency", label: "ความด่วน", render: i => ({ high: "🔴 เร่งด่วน", medium: "🟡 ด่วนเล็กน้อย", low: "🟢 ไม่ด่วน" }[i.urgency] || "—") },
            { key: "qty", label: "จำนวน", render: i => <span style={{fontSize:12}}>{i.qty_new>0?`🆕${i.qty_new} `:""}{i.qty_used>0?`✅${i.qty_used} `:""}{i.qty_damaged>0?`❌${i.qty_damaged}`:""}</span> },
          ]}
          onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  );
}

// ── Parts Form ────────────────────────────────────────────────
const emptyPart = { ID: "", Desc: "", Price: "", part_store: "", place: "", Date_of_Buy: "", qty_new: 0, qty_used: 0, qty_damaged: 0, ETC: "" };
function PartsForm({ showToast }) {
  const [form, setForm] = useState(emptyPart);
  const [picture, setPicture] = useState(null);       // File object
  const [preview, setPreview] = useState(null);       // preview URL
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPicture(file);
    setPreview(URL.createObjectURL(file));
  };
  const fetchItems = () => { setLoadingItems(true); api("/api/parts").then(r => r.json()).then(d => { setItems(d); setLoadingItems(false); }).catch(() => setLoadingItems(false)); };
  useEffect(() => { fetchItems(); }, []);
  const handleEdit = (item) => {
    setForm({ ID: item.ID, Desc: item.Desc, Price: item.Price, part_store: item.part_store || "", place: item.place || "", qty_new: item.qty_new || 0, qty_used: item.qty_used || 0, qty_damaged: item.qty_damaged || 0, ETC: item.ETC || "", Date_of_Buy: item.Date_of_Buy ? item.Date_of_Buy.slice(0, 16) : "", Picture: item.Picture || "" });
    setPicture(null);
    setPreview(item.Picture ? `http://localhost:3001${item.Picture}` : null);
    setEditMode(true); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleCancel = () => { setForm(emptyPart); setPicture(null); setPreview(null); setEditMode(false); };
  const handleDelete = async (item) => {
    if (!window.confirm(`ลบอะไหล่ "${item.Desc}" ใช่ไหม?`)) return;
    const res = await api(`/api/parts/${item.ID}`, { method: "DELETE" });
    const d = await res.json();
    if (!res.ok) { showToast(d.error || "เกิดข้อผิดพลาด", "#dc2626"); return; }
    showToast(`ลบ "${item.Desc}" เรียบร้อย`); fetchItems();
  };
  const handleSubmit = async () => {
    if (!form.ID || !form.Desc) { showToast("กรุณากรอก ID และชื่ออะไหล่ให้ครบ", "#dc2626"); return; }
    if (!editMode && isDuplicateID(form.ID, items)) { showToast(`ID "${form.ID}" มีอยู่แล้ว กรุณาใช้ ID อื่น`, "#dc2626"); return; }
    setLoading(true);
    try {
      // ใช้ FormData เพื่อส่งรูปพร้อมข้อมูล
      const fd = new FormData();
      Object.entries({ ...form, Date_of_Buy: form.Date_of_Buy || new Date().toISOString().slice(0,19).replace("T"," ") })
        .forEach(([k, v]) => fd.append(k, v ?? ""));
      if (picture) fd.append("picture", picture);
      const res = await api(editMode ? `/api/parts/${form.ID}` : "/api/parts", { method: editMode ? "PUT" : "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "เกิดข้อผิดพลาด");
      showToast(editMode ? `แก้ไข "${form.Desc}" สำเร็จ` : `เพิ่มอะไหล่ "${form.Desc}" สำเร็จ`);
      setForm(emptyPart); setPicture(null); setPreview(null); setEditMode(false); fetchItems();
    } catch (e) { showToast(e.message, "#dc2626"); }
    setLoading(false);
  };
  return (
    <div>
      {editMode && <EditBanner desc={form.Desc} onCancel={handleCancel} />}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="รหัสอะไหล่ (ID) *">
          <div style={{ display: "flex", gap: 6 }}>
            <input value={form.ID} onChange={e => set("ID", e.target.value)} disabled={editMode} placeholder="เช่น E0010001" style={editMode ? inputDisabled : inputStyle} />
            {!editMode && <GenBtn onClick={() => {
              const id = genNextID("parts", items);
              setForm(f => ({ ...f, ID: id, place: "บ้านช่าง", Date_of_Buy: nowDateTimeLocal(), part_condition: "New" }));
            }} />}
          </div>
        </Field>
        <Field label="ชื่ออะไหล่ *"><input value={form.Desc} onChange={e => set("Desc", e.target.value)} placeholder="เช่น หลอดไฟ LED" style={inputStyle} /></Field>
        <Field label="ราคา (บาท)"><input value={form.Price} onChange={e => set("Price", e.target.value)} placeholder="0" type="number" style={inputStyle} /></Field>
        <Field label="ร้านค้า"><input value={form.part_store} onChange={e => set("part_store", e.target.value)} placeholder="เช่น GlobalHouse" style={inputStyle} /></Field>
        <Field label="สถานที่เก็บ"><input value={form.place} onChange={e => set("place", e.target.value)} placeholder="เช่น ตู้เก็บอะไหล่ A" style={inputStyle} /></Field>
        <Field label="จำนวนใหม่"><input value={form.qty_new} onChange={e => set("qty_new", e.target.value)} type="number" min="0" placeholder="0" style={inputStyle} /></Field>
        <Field label="จำนวนใช้แล้ว"><input value={form.qty_used} onChange={e => set("qty_used", e.target.value)} type="number" min="0" placeholder="0" style={inputStyle} /></Field>
        <Field label="จำนวนเสีย"><input value={form.qty_damaged} onChange={e => set("qty_damaged", e.target.value)} type="number" min="0" placeholder="0" style={inputStyle} /></Field>
        <Field label="วันที่ซื้อ"><input value={form.Date_of_Buy} onChange={e => set("Date_of_Buy", e.target.value)} type="datetime-local" style={inputStyle} /></Field>
      </div>
      <Field label="หมายเหตุ"><input value={form.ETC} onChange={e => set("ETC", e.target.value)} placeholder="(ไม่บังคับ)" style={inputStyle} /></Field>

      {/* รูปภาพ */}
      <Field label="รูปภาพ (ไม่บังคับ)">
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 100, height: 100, borderRadius: 10, border: "2px dashed #e2e8f0", cursor: "pointer", background: "#f8fafc", flexShrink: 0, overflow: "hidden" }}>
            {preview
              ? <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 28, color: "#cbd5e1" }}>📷</span>
            }
            <input type="file" accept="image/*" onChange={handlePictureChange} style={{ display: "none" }} />
          </label>
          <div style={{ fontSize: 12, color: "#94a3b8", paddingTop: 8 }}>
            คลิกที่กล่องเพื่อเลือกรูป<br/>รองรับ JPG, PNG ขนาดไม่เกิน 5MB
            {preview && <div><button type="button" onClick={() => { setPicture(null); setPreview(null); }} style={{ marginTop: 6, background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 12, padding: 0 }}>✕ ลบรูป</button></div>}
          </div>
        </div>
      </Field>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleSubmit} disabled={loading} style={submitBtn(loading, editMode)}>{loading ? "กำลังบันทึก..." : editMode ? "💾 บันทึกการแก้ไข" : "➕ เพิ่มอะไหล่"}</button>
        {editMode && <button onClick={handleCancel} style={{ padding: "11px 20px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 14, cursor: "pointer", color: "#475569" }}>ยกเลิก</button>}
      </div>
      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>รายการทั้งหมด ({items.length})</div>
        <ItemTable items={items} loading={loadingItems}
          columns={[
            { key: "ID", label: "รหัส" },
            { key: "Picture", label: "รูป", render: i => i.Picture ? <img src={`http://localhost:3001${i.Picture}`} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6 }} /> : <span style={{ color: "#cbd5e1" }}>—</span> },
            { key: "Desc", label: "ชื่อ" },
            { key: "place", label: "สถานที่เก็บ" },
            { key: "qty", label: "จำนวน", render: i => <span style={{fontSize:12}}>{i.qty_new>0?`🆕${i.qty_new} `:""}{i.qty_used>0?`✅${i.qty_used} `:""}{i.qty_damaged>0?`❌${i.qty_damaged}`:""}</span> },
          ]}
          onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  );
}

// ── Tools Form ────────────────────────────────────────────────
const emptyTool = { ID: "", Desc: "", Price: "", tool_store: "", place: "", Date_of_Buy: "", qty_new: 0, qty_used: 0, qty_damaged: 0, ETC: "" };
function ToolsForm({ showToast }) {
  const [form, setForm] = useState(emptyTool);
  const [picture, setPicture] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPicture(file); setPreview(URL.createObjectURL(file));
  };
  const fetchItems = () => { setLoadingItems(true); api("/api/tools").then(r => r.json()).then(d => { setItems(d); setLoadingItems(false); }).catch(() => setLoadingItems(false)); };
  useEffect(() => { fetchItems(); }, []);
  const handleEdit = (item) => {
    setForm({ ID: item.ID, Desc: item.Desc, Price: item.Price, tool_store: item.tool_store || "", place: item.place || "", qty_new: item.qty_new || 0, qty_used: item.qty_used || 0, qty_damaged: item.qty_damaged || 0, ETC: item.ETC || "", Date_of_Buy: item.Date_of_Buy ? item.Date_of_Buy.slice(0, 16) : "", Picture: item.Picture || "" });
    setPicture(null); setPreview(item.Picture ? `http://localhost:3001${item.Picture}` : null);
    setEditMode(true); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleCancel = () => { setForm(emptyTool); setPicture(null); setPreview(null); setEditMode(false); };
  const handleDelete = async (item) => {
    if (!window.confirm(`ลบอุปกรณ์ "${item.Desc}" ใช่ไหม?`)) return;
    const res = await api(`/api/tools/${item.ID}`, { method: "DELETE" });
    const d = await res.json();
    if (!res.ok) { showToast(d.error || "เกิดข้อผิดพลาด", "#dc2626"); return; }
    showToast(`ลบ "${item.Desc}" เรียบร้อย`); fetchItems();
  };
  const handleSubmit = async () => {
    if (!form.ID || !form.Desc) { showToast("กรุณากรอก ID และชื่ออุปกรณ์ให้ครบ", "#dc2626"); return; }
    if (!editMode && isDuplicateID(form.ID, items)) { showToast(`ID "${form.ID}" มีอยู่แล้ว กรุณาใช้ ID อื่น`, "#dc2626"); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries({ ...form, Date_of_Buy: form.Date_of_Buy || new Date().toISOString().slice(0,19).replace("T"," ") })
        .forEach(([k, v]) => fd.append(k, v ?? ""));
      if (picture) fd.append("picture", picture);
      const res = await api(editMode ? `/api/tools/${form.ID}` : "/api/tools", { method: editMode ? "PUT" : "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "เกิดข้อผิดพลาด");
      showToast(editMode ? `แก้ไข "${form.Desc}" สำเร็จ` : `เพิ่มอุปกรณ์ "${form.Desc}" สำเร็จ`);
      setForm(emptyTool); setPicture(null); setPreview(null); setEditMode(false); fetchItems();
    } catch (e) { showToast(e.message, "#dc2626"); }
    setLoading(false);
  };
  return (
    <div>
      {editMode && <EditBanner desc={form.Desc} onCancel={handleCancel} />}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="รหัสอุปกรณ์ (ID) *">
          <div style={{ display: "flex", gap: 6 }}>
            <input value={form.ID} onChange={e => set("ID", e.target.value)} disabled={editMode} placeholder="เช่น T0010001" style={editMode ? inputDisabled : inputStyle} />
            {!editMode && <GenBtn onClick={() => {
              const id = genNextID("tools", items);
              setForm(f => ({ ...f, ID: id, place: "บ้านช่าง", Date_of_Buy: nowDateTimeLocal(), tool_condition: "New" }));
            }} />}
          </div>
        </Field>
        <Field label="ชื่ออุปกรณ์ *"><input value={form.Desc} onChange={e => set("Desc", e.target.value)} placeholder="เช่น ไขควงปากแบน" style={inputStyle} /></Field>
        <Field label="ราคา (บาท)"><input value={form.Price} onChange={e => set("Price", e.target.value)} placeholder="0" type="number" style={inputStyle} /></Field>
        <Field label="ร้านค้า"><input value={form.tool_store} onChange={e => set("tool_store", e.target.value)} placeholder="เช่น HomePro" style={inputStyle} /></Field>
        <Field label="สถานที่เก็บ"><input value={form.place} onChange={e => set("place", e.target.value)} placeholder="เช่น ห้องเก็บอุปกรณ์" style={inputStyle} /></Field>
        <Field label="จำนวนใหม่"><input value={form.qty_new} onChange={e => set("qty_new", e.target.value)} type="number" min="0" placeholder="0" style={inputStyle} /></Field>
        <Field label="จำนวนใช้แล้ว"><input value={form.qty_used} onChange={e => set("qty_used", e.target.value)} type="number" min="0" placeholder="0" style={inputStyle} /></Field>
        <Field label="จำนวนเสีย"><input value={form.qty_damaged} onChange={e => set("qty_damaged", e.target.value)} type="number" min="0" placeholder="0" style={inputStyle} /></Field>
        <Field label="วันที่ซื้อ"><input value={form.Date_of_Buy} onChange={e => set("Date_of_Buy", e.target.value)} type="datetime-local" style={inputStyle} /></Field>
      </div>
      <Field label="หมายเหตุ"><input value={form.ETC} onChange={e => set("ETC", e.target.value)} placeholder="(ไม่บังคับ)" style={inputStyle} /></Field>

      <Field label="รูปภาพ (ไม่บังคับ)">
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 100, height: 100, borderRadius: 10, border: "2px dashed #e2e8f0", cursor: "pointer", background: "#f8fafc", flexShrink: 0, overflow: "hidden" }}>
            {preview ? <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 28, color: "#cbd5e1" }}>📷</span>}
            <input type="file" accept="image/*" onChange={handlePictureChange} style={{ display: "none" }} />
          </label>
          <div style={{ fontSize: 12, color: "#94a3b8", paddingTop: 8 }}>
            คลิกที่กล่องเพื่อเลือกรูป<br/>รองรับ JPG, PNG ขนาดไม่เกิน 5MB
            {preview && <div><button type="button" onClick={() => { setPicture(null); setPreview(null); }} style={{ marginTop: 6, background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 12, padding: 0 }}>✕ ลบรูป</button></div>}
          </div>
        </div>
      </Field>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleSubmit} disabled={loading} style={submitBtn(loading, editMode)}>{loading ? "กำลังบันทึก..." : editMode ? "💾 บันทึกการแก้ไข" : "➕ เพิ่มอุปกรณ์"}</button>
        {editMode && <button onClick={handleCancel} style={{ padding: "11px 20px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 14, cursor: "pointer", color: "#475569" }}>ยกเลิก</button>}
      </div>
      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>รายการทั้งหมด ({items.length})</div>
        <ItemTable items={items} loading={loadingItems}
          columns={[
            { key: "ID", label: "รหัส" },
            { key: "Picture", label: "รูป", render: i => i.Picture ? <img src={`http://localhost:3001${i.Picture}`} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6 }} /> : <span style={{ color: "#cbd5e1" }}>—</span> },
            { key: "Desc", label: "ชื่อ" },
            { key: "place", label: "สถานที่เก็บ" },
            { key: "qty", label: "จำนวน", render: i => <span style={{fontSize:12}}>{i.qty_new>0?`🆕${i.qty_new} `:""}{i.qty_used>0?`✅${i.qty_used} `:""}{i.qty_damaged>0?`❌${i.qty_damaged}`:""}</span> },
          ]}
          onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  );
}

// ── Users Form ────────────────────────────────────────────────
const emptyUser = { username: "", password: "", role: "พนักงาน" };
function UsersForm({ showToast }) {
  const [form, setForm] = useState(emptyUser);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const fetchUsers = () => { setLoadingUsers(true); api("/api/auth/users").then(r => r.json()).then(d => { setUsers(d); setLoadingUsers(false); }).catch(() => setLoadingUsers(false)); };
  useEffect(() => { fetchUsers(); }, []);
  const handleSubmit = async () => {
    if (!form.username || !form.password) { showToast("กรุณากรอก username และ password", "#dc2626"); return; }
    if (form.password.length < 4) { showToast("password ต้องมีอย่างน้อย 4 ตัวอักษร", "#dc2626"); return; }
    setLoading(true);
    try {
      const res = await api("/api/auth/register", { method: "POST", body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "เกิดข้อผิดพลาด");
      showToast(`เพิ่มผู้ใช้ "${form.username}" สำเร็จ`);
      setForm(emptyUser); fetchUsers();
    } catch (e) { showToast(e.message, "#dc2626"); }
    setLoading(false);
  };
  const handleDelete = async (id, username) => {
    if (!window.confirm(`ลบผู้ใช้ "${username}" ใช่ไหม?`)) return;
    try {
      const res = await api(`/api/auth/users/${id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "เกิดข้อผิดพลาด");
      showToast(`ลบ "${username}" เรียบร้อย`); fetchUsers();
    } catch (e) { showToast(e.message, "#dc2626"); }
  };
  const roleColor = { แอดมิน: "#7c3aed", ช่าง: "#d97706", พนักงาน: "#0891b2" };
  const roleBg = { แอดมิน: "#f5f3ff", ช่าง: "#fef3c7", พนักงาน: "#e0f2fe" };
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label="Username *"><input value={form.username} onChange={e => set("username", e.target.value)} placeholder="เช่น staff02" style={inputStyle} /></Field>
        <Field label="Role"><Select value={form.role} onChange={e => set("role", e.target.value)} options={[{ value: "พนักงาน", label: "👷 พนักงาน" }, { value: "ช่าง", label: "🔧 ช่าง" }, { value: "แอดมิน", label: "⚙️ แอดมิน" }]} /></Field>
        <Field label="Password *"><input value={form.password} onChange={e => set("password", e.target.value)} placeholder="อย่างน้อย 4 ตัวอักษร" type="password" style={inputStyle} /></Field>
      </div>
      <button onClick={handleSubmit} disabled={loading} style={submitBtn(loading, false)}>{loading ? "กำลังบันทึก..." : "➕ เพิ่มผู้ใช้"}</button>
      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>ผู้ใช้ในระบบทั้งหมด ({users.length} คน)</div>
        {loadingUsers ? <div style={{ color: "#94a3b8", fontSize: 14 }}>กำลังโหลด...</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {users.map(u => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", borderRadius: 10, padding: "12px 16px", border: "1.5px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 99, background: roleBg[u.role] || "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    {u.role === "แอดมิน" ? "⚙️" : u.role === "ช่าง" ? "🔧" : "👷"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{u.username}</div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 99, color: roleColor[u.role] || "#475569", background: roleBg[u.role] || "#f1f5f9" }}>{u.role}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(u.id, u.username)} style={{ padding: "5px 12px", borderRadius: 7, border: "1.5px solid #fca5a5", background: "#fff", color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>ลบ</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
const TABS = [
  { key: "stuff", label: "🏨 ของที่จะซ่อม", desc: "stuff_to_maintenance" },
  { key: "parts", label: "🔩 อะไหล่", desc: "parts" },
  { key: "tools", label: "🔧 อุปกรณ์", desc: "tools" },
  { key: "users", label: "👤 ผู้ใช้งาน", desc: "users" },
];

export default function AdminPanel({ user, onBack }) {
  const [activeTab, setActiveTab] = useState("stuff");
  const [toast, setToast] = useState(null);
  const showToast = (msg, color = "#16a34a") => { setToast({ msg, color }); setTimeout(() => setToast(null), 3000); };
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Sarabun, 'Noto Sans Thai', sans-serif" }}>
      <Toast toast={toast} />
      <div style={{ background: "#fff", borderBottom: "1.5px solid #e2e8f0", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontSize: 16 }}>⚙️</span></div>
          <div><div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>Admin Panel</div><div style={{ fontSize: 11, color: "#94a3b8" }}>จัดการข้อมูล</div></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "#64748b" }}>{user.username} · <strong style={{ color: "#1e40af" }}>{user.role}</strong></span>
          <button onClick={onBack} style={{ background: "#f1f5f9", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", color: "#475569", fontWeight: 600 }}>← กลับหน้าหลัก</button>
        </div>
      </div>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}>
        <div style={{ display: "flex", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
          {TABS.map((tab, i) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ flex: 1, padding: "14px 8px", border: "none", borderRight: i < TABS.length - 1 ? "1.5px solid #e2e8f0" : "none", background: activeTab === tab.key ? "#1e40af" : "#fff", color: activeTab === tab.key ? "#fff" : "#64748b", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .15s", fontFamily: "inherit" }}>{tab.label}</button>
          ))}
        </div>
        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", padding: "28px 32px" }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#1e293b" }}>{TABS.find(t => t.key === activeTab)?.label}</h2>
            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>ตาราง: {TABS.find(t => t.key === activeTab)?.desc} · * = จำเป็น</p>
          </div>
          {activeTab === "stuff" && <StuffForm showToast={showToast} />}
          {activeTab === "parts" && <PartsForm showToast={showToast} />}
          {activeTab === "tools" && <ToolsForm showToast={showToast} />}
          {activeTab === "users" && <UsersForm showToast={showToast} />}
        </div>
      </div>
      <style>{`* { box-sizing: border-box; } input:focus, select:focus { border-color: #1e40af !important; box-shadow: 0 0 0 3px #1e40af22; outline: none; }`}</style>
    </div>
  );
}
