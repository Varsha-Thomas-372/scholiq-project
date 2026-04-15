import { useState } from "react";
import { AppShell } from "../layout/AppShell";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../api/supabase";
import { useStudentData } from "../hooks/useStudentData";

export function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const { mode, setMode } = useTheme();
  const { syllabus, topics, schedule } = useStudentData();
  const [name, setName] = useState(profile?.name ?? "");
  const [notifications, setNotifications] = useState({ email: true, reminders: true });
  const [message, setMessage] = useState("");

  const saveProfile = async () => {
    if (!profile) return;
    const { error } = await supabase.from("users").update({ name }).eq("id", profile.id);
    if (!error) {
      await refreshProfile();
      setMessage("Profile saved.");
    }
  };

  const exportData = () => {
    const payload = { profile, syllabus, topics, schedule };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scholiq-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <h2 className="font-display text-2xl text-fg">Settings</h2>
        <section className="rounded-2xl border border-white/10 bg-surface p-4">
          <h3 className="text-sm uppercase text-muted">Profile</h3>
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl border border-white/15 bg-panel px-3 py-2 text-fg" />
            <input value={profile?.email ?? ""} disabled className="rounded-xl border border-white/15 bg-panel px-3 py-2 text-muted" />
          </div>
          <button onClick={saveProfile} className="mt-3 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white" type="button">
            Save Profile
          </button>
        </section>
        <section className="rounded-2xl border border-white/10 bg-surface p-4">
          <h3 className="text-sm uppercase text-muted">Theme</h3>
          <div className="mt-2 flex gap-2">
            <button onClick={() => setMode("dark")} className={`rounded-xl px-4 py-2 ${mode === "dark" ? "bg-accent text-white" : "bg-panel text-fg"}`} type="button">
              Dark
            </button>
            <button onClick={() => setMode("light")} className={`rounded-xl px-4 py-2 ${mode === "light" ? "bg-accent text-white" : "bg-panel text-fg"}`} type="button">
              Light
            </button>
          </div>
        </section>
        <section className="rounded-2xl border border-white/10 bg-surface p-4">
          <h3 className="text-sm uppercase text-muted">Notifications</h3>
          <label className="mt-2 flex items-center gap-2 text-fg">
            <input type="checkbox" checked={notifications.email} onChange={() => setNotifications((prev) => ({ ...prev, email: !prev.email }))} />
            Email alerts
          </label>
          <label className="mt-2 flex items-center gap-2 text-fg">
            <input type="checkbox" checked={notifications.reminders} onChange={() => setNotifications((prev) => ({ ...prev, reminders: !prev.reminders }))} />
            Study reminders
          </label>
        </section>
        <section className="rounded-2xl border border-white/10 bg-surface p-4">
          <h3 className="text-sm uppercase text-muted">Data Export</h3>
          <button onClick={exportData} className="mt-2 rounded-xl border border-white/15 bg-panel px-4 py-2 text-fg hover:border-accent" type="button">
            Export My Data
          </button>
        </section>
        {message && <p className="text-sm text-emerald-300">{message}</p>}
      </div>
    </AppShell>
  );
}
