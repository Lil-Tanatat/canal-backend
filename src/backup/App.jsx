import { useState } from "react";
import Login from "./Login";
import ServiceOrder from "./ServiceOrder";
import AdminPanel from "./AdminPanel";
import RepairReport from "./RepairReport";
import InventoryList from "./InventoryList";

function getUserFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    // decode payload จาก JWT (base64)
    const payload = JSON.parse(decodeURIComponent(escape(atob(token.split(".")[1]))));
    // เช็คว่า token หมดอายุยัง (exp เป็น unix timestamp)
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      return null;
    }
    return { id: payload.id, username: payload.username, role: payload.role };
  } catch {
    localStorage.removeItem("token");
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState(getUserFromToken); // โหลด user จาก token ทันที
  const [page, setPage] = useState("main");

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setPage("main");
  };

  if (!user) return <Login onLogin={setUser} />;

  if (page === "admin" && user.role === "แอดมิน")
    return <AdminPanel user={user} onBack={() => setPage("main")} />;

  if (page === "report")
    return <RepairReport user={user} onBack={() => setPage("main")} />;

  if (page === "inventory")
    return <InventoryList user={user} onBack={() => setPage("main")} />;

  return (
    <ServiceOrder
      user={user}
      onLogout={handleLogout}
      onAdmin={user.role === "แอดมิน" ? () => setPage("admin") : null}
      onReport={() => setPage("report")}
      onInventory={() => setPage("inventory")}
    />
  );
}
