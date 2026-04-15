import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { AppShell } from "../layout/AppShell";
import { useStudentData } from "../hooks/useStudentData";
import { useTheme } from "../context/ThemeContext";

export function HomePage() {
  const { syllabus, allTopics, completion, schedule, loading } = useStudentData();
  const { critical } = useTheme();

  if (loading) {
    return (
      <AppShell>
        <div className="text-fg">Loading dashboard...</div>
      </AppShell>
    );
  }

  if (!syllabus) {
    return (
      <AppShell>
        <div className="grid min-h-[70vh] place-items-center rounded-2xl border border-white/10 bg-surface p-8 text-center">
          <div>
            <h2 className="font-display text-2xl text-fg">Upload your syllabus to unlock SCHOLIQ</h2>
            <p className="mt-2 text-muted">Your dashboard comes alive once your first syllabus is uploaded.</p>
            <Link to="/upload" className="mt-5 inline-block rounded-xl bg-accent px-5 py-3 font-semibold text-white">
              Go to Upload
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // Calculate global metrics across all syllabuses
  const weekly = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => {
    const count = allTopics.filter((_t, i) => i % 7 === index && _t.status === "done").length;
    return { day, completed: count };
  });
  const pending = allTopics.filter((t) => t.status !== "done").slice(0, 5);
  const pendingCount = allTopics.filter((t) => t.status === "pending").length;
  const daysUntilExam = schedule?.exam_date ? Math.max(0, Math.ceil((new Date(schedule.exam_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;

  return (
    <AppShell>
      <div className="space-y-5">
        {critical && (
          <div className="rounded-2xl border border-red-400/50 bg-red-500/10 p-4 text-red-200">
            <p className="font-semibold">Critical Mode Active</p>
            <p className="text-sm">Exam in {daysUntilExam ?? "-"} day(s). SCHOLIQ switched to high-priority theme automatically.</p>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-4">
          <Stat title="Completion" value={`${completion}%`} />
          <Stat title="Pending Topics" value={String(pendingCount)} />
          <Stat title="Days Until Exam" value={daysUntilExam !== null ? String(daysUntilExam) : "Not set"} />
          <Stat title="Cohort Pulse" value={completion > 60 ? "Stable" : "Needs focus"} />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-2xl border border-white/10 bg-surface p-4 lg:col-span-2">
            <h3 className="font-display text-lg text-fg">Weekly Study Completion</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekly}>
                  <defs>
                    <linearGradient id="ac" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="day" stroke="var(--muted)" />
                  <YAxis stroke="var(--muted)" />
                  <Tooltip />
                  <Area type="monotone" dataKey="completed" stroke="var(--accent)" fillOpacity={1} fill="url(#ac)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="rounded-2xl border border-white/10 bg-surface p-4">
            <h3 className="font-display text-lg text-fg">Gap Alerts</h3>
            <div className="mt-3 space-y-2">
              {pending.length ? (
                pending.map((topic) => (
                  <div key={topic.id} className="rounded-xl border border-white/10 bg-panel p-3 text-sm text-fg">
                    {topic.name}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">No high-risk gaps right now.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-4">
      <p className="text-xs uppercase text-muted">{title}</p>
      <p className="mt-2 font-display text-2xl text-fg">{value}</p>
    </div>
  );
}
