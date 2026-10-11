import { useState, useRef } from "react";
import { NavLink, Link } from "react-router-dom";
import { ArrowUpRight, Bell, Menu, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { isDemo } from "@/lib/config";
const routes = [
  ["/", "Overview"],
  ["/upload", "Upload & Analyze"],
  ["/risk-map", "Risk Map"],
  ["/simulator", "Simulator"],
  ["/reports", "Reports"],
  ["/settings", "Settings"],
];
export function TopNavBar() {
  const [menu, setMenu] = useState(false);
  const [bell, setBell] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const bellButton = useRef<HTMLButtonElement>(null);
  const { notifications, markNotificationRead, clearNotifications } =
    useAppStore();
  return (
    <header
      className="site-header"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          if (bell) bellButton.current?.focus();
          else if (menu) menuButton.current?.focus();
          setMenu(false);
          setBell(false);
        }
      }}
    >
      <div className="brand-row">
        <Link to="/" className="brand">
          ClimateRisk <ArrowUpRight size={21} />
        </Link>
        <div className="header-tools">
          <span className="mode-tag">
            <i />
            {isDemo ? "Demonstration" : "Connected workspace"}
          </span>
          <button
            ref={bellButton}
            className="icon-button"
            aria-label={`Notifications${notifications.some((n) => !n.read) ? ", unread items" : ""}`}
            aria-expanded={bell}
            aria-controls="notifications"
            onClick={() => setBell(!bell)}
          >
            <Bell size={18} />
            {notifications.some((n) => !n.read) && <i className="unread-dot" />}
          </button>
          <button
            ref={menuButton}
            className="icon-button mobile-menu"
            aria-label="Navigation menu"
            aria-expanded={menu}
            aria-controls="main-nav"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
      <nav
        id="main-nav"
        aria-label="Main navigation"
        className={`main-nav ${menu ? "open" : ""}`}
      >
        {routes.map(([path, label], i) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            onClick={() => setMenu(false)}
          >
            <span className="nav-index">0{i + 1}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      {bell && (
        <section
          id="notifications"
          className="notification-panel"
          aria-label="Notifications"
        >
          <div className="section-heading">
            <h2>Notifications</h2>
            <button className="text-button" onClick={clearNotifications}>
              Clear
            </button>
          </div>
          {notifications.length ? (
            notifications.map((n) => (
              <button
                key={n.id}
                className={`notification ${n.read ? "read" : ""}`}
                onClick={() => markNotificationRead(n.id)}
              >
                {n.message}
                <small>
                  {new Date(n.timestamp).toLocaleString()}
                  {n.read ? " · Read" : " · Mark as read"}
                </small>
              </button>
            ))
          ) : (
            <p>No notifications yet.</p>
          )}
        </section>
      )}
    </header>
  );
}
