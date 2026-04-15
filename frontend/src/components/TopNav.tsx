import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export function TopNav() {
  const { profile, signOut } = useAuth();
  const { critical } = useTheme();
  return (
    <header className={`sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-surface/90 px-4 py-3 backdrop-blur ${critical ? "shadow-[0_0_0_1px_rgba(255,59,48,0.3)]" : ""}`}>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">{profile?.role === "FACULTY" ? "Faculty Workspace" : "Student Workspace"}</p>
        <h1 className="font-display text-lg font-semibold text-fg">Hello, {profile?.name ?? "Learner"}</h1>
      </div>
      <button onClick={signOut} className="rounded-xl border border-white/15 bg-panel px-3 py-2 text-sm text-fg hover:border-accent" type="button">
        Sign out
      </button>
    </header>
  );
}
