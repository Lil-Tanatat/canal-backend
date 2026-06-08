import { useState } from "react";
import Login from "./Login";
import ServiceOrder from "./ServiceOrder";
import AdminPanel from "./AdminPanel";
import RepairReport from "./RepairReport";
import InventoryList from "./InventoryList";
import { useNotifications } from "./hooks/useNotifications";
import { useToast } from "./components/ToastContainer";
import ToastContainer from "./components/ToastContainer";
import NotificationBell from "./components/NotificationBell";

function getUserFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(decodeURIComponent(escape(atob(token.split(".")[1]))));
    if (payload.exp * 1000 < Date.now()) { localStorage.removeItem("token"); return null; }
    return { id: payload.id, username: payload.username, role: payload.role };
  } catch { localStorage.removeItem("token"); return null; }
}

export default function App() {
  const [user, setUser] = useState(getUserFromToken);
  const [page, setPage] = useState("main");

  // Toast
  const { toasts, addToast, removeToast } = useToast();

  // Notifications (ส่ง addToast เข้าไปด้วย)
  const notif = useNotifications(user, addToast);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setPage("main");
  };

  if (!user) return <Login onLogin={setUser} />;

  const notifBell = (
    <NotificationBell
      notifications={notif.notifications}
      unreadCount={notif.unreadCount}
      pushEnabled={notif.pushEnabled}
      swReady={notif.swReady}
      onMarkRead={notif.markRead}
      onMarkAllRead={notif.markAllRead}
      onRemove={notif.remove}
      onEnablePush={notif.enablePush}
      onDisablePush={notif.disablePush}
    />
  );

  return (
    <>
      {/* Toast ลอยมุมขวาล่าง */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {page === "admin" && user.role === "แอดมิน" && (
        <AdminPanel user={user} onBack={() => setPage("main")} />
      )}
      {page === "report" && (
        <RepairReport user={user} onBack={() => setPage("main")} />
      )}
      {page === "inventory" && (
        <InventoryList user={user} onBack={() => setPage("main")} />
      )}
      {page === "main" && (
        <ServiceOrder
          user={user}
          onLogout={handleLogout}
          onAdmin={user.role === "แอดมิน" ? () => setPage("admin") : null}
          onReport={() => setPage("report")}
          onInventory={() => setPage("inventory")}
          notifBell={notifBell}
        />
      )}
    </>
  );
}
