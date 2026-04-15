import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { UserRole } from "../types";

interface NavItem {
  path: string;
  label: string;
}

const studentNav: NavItem[] = [
  { path: "/home", label: "Home" },
  { path: "/resources", label: "Resources" },
  { path: "/scheduler", label: "Scheduler" },
  { path: "/mcq", label: "MCQ" },
  { path: "/progress", label: "Progress" },
  { path: "/pyq", label: "PYQ" },
  { path: "/settings", label: "Settings" }
];

const facultyNav: NavItem[] = [
  { path: "/faculty", label: "Faculty Dashboard" },
  { path: "/settings", label: "Settings" }
];

function NavLinks({ nav }: { nav: NavItem[] }) {
  const location = useLocation();
  const { critical } = useTheme();
  return (
    <>
      {nav.map((item) => {
        const active = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`rounded-xl px-4 py-2 text-sm transition ${active ? "bg-accent text-white" : "text-muted hover:bg-panel hover:text-fg"}`}
          >
            <span>{item.label}</span>
            {critical && item.path !== "/settings" && <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-red-400" />}
          </Link>
        );
      })}
    </>
  );
}

export function Sidebar({ role }: { role: UserRole }) {
  const nav = role === "FACULTY" ? facultyNav : studentNav;
  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-surface p-4 lg:block">
        <h2 className="font-display text-xl font-semibold text-fg">SCHOLIQ</h2>
        <div className="mt-6 flex flex-col gap-2">
          <NavLinks nav={nav} />
        </div>
      </aside>
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-white/10 bg-surface/95 p-2 backdrop-blur lg:hidden">
        {nav.map((item) => (
          <Link key={item.path} to={item.path} className="rounded-lg px-3 py-2 text-xs text-fg">
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
