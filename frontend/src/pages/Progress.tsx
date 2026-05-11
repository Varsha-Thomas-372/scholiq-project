import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "../layout/AppShell";
import { useStudentData } from "../hooks/useStudentData";

const STATUS_COLORS: Record<string, string> = {
  done: "#22C55E",
  in_progress: "#F59E0B",
  pending: "#64748B",
  flagged: "#EF4444"
};

export function ProgressPage() {
  const { syllabus, topics, completion, loading } = useStudentData();

  const statusData = useMemo(() => {
    const counts = { done: 0, in_progress: 0, pending: 0, flagged: 0 };
    topics.forEach((topic) => {
      counts[topic.status] += 1;
    });
    return [
      { name: "Done", value: counts.done, color: STATUS_COLORS.done },
      { name: "In Progress", value: counts.in_progress, color: STATUS_COLORS.in_progress },
      { name: "Pending", value: counts.pending, color: STATUS_COLORS.pending },
      { name: "Flagged", value: counts.flagged, color: STATUS_COLORS.flagged }
    ];
  }, [topics]);

  const unitProgress = useMemo(() => {
    return syllabus?.units.map((unit) => {
      const unitTopics = topics.filter((topic) => topic.unit === unit.unit);
      const doneTopics = unitTopics.filter((topic) => topic.status === "done").length;
      const percent = unitTopics.length ? Math.round((doneTopics / unitTopics.length) * 100) : 0;
      return {
        unit: unit.unit.length > 18 ? `${unit.unit.slice(0, 18)}...` : unit.unit,
        fullUnit: unit.unit,
        percent,
        total: unitTopics.length
      };
    }) ?? [];
  }, [syllabus, topics]);

  const topScores = useMemo(() => {
    return [...topics]
      .sort((a, b) => b.mcq_score - a.mcq_score)
      .slice(0, 5)
      .map((topic) => ({ name: topic.name, score: topic.mcq_score }));
  }, [topics]);

  const weakTopics = useMemo(() => {
    return topics
      .filter((topic) => topic.status !== "done" || topic.mcq_score < 67)
      .sort((a, b) => a.mcq_score - b.mcq_score)
      .slice(0, 5);
  }, [topics]);

  if (loading) {
    return (
      <AppShell>
        <div className="text-fg">Loading progress insights...</div>
      </AppShell>
    );
  }

  if (!syllabus) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-white/10 bg-surface p-8 text-center">
          <h2 className="font-display text-2xl text-fg">No progress data yet</h2>
          <p className="mt-2 text-muted">Upload a syllabus and complete a few activities to unlock progress tracking.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Overall Completion" value={`${completion}%`} />
          <StatCard title="Topics Covered" value={String(topics.filter((topic) => topic.status === "done").length)} />
          <StatCard title="Practice Average" value={`${Math.round(topics.reduce((sum, topic) => sum + topic.mcq_score, 0) / Math.max(1, topics.length))}%`} />
          <StatCard title="Attention Needed" value={String(topics.filter((topic) => topic.status === "flagged" || topic.status === "pending").length)} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-surface p-4">
            <h3 className="font-display text-lg text-fg">Topic Status Distribution</h3>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100} paddingAngle={4}>
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {statusData.map((item) => (
                <div key={item.name} className="rounded-xl border border-white/10 bg-panel p-3">
                  <p className="text-xs uppercase text-muted">{item.name}</p>
                  <p className="mt-1 text-lg text-fg">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-surface p-4">
            <h3 className="font-display text-lg text-fg">Unit Completion</h3>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="unit" stroke="var(--muted)" />
                  <YAxis stroke="var(--muted)" />
                  <Tooltip />
                  <Bar dataKey="percent" fill="var(--accent)" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-surface p-4">
            <h3 className="font-display text-lg text-fg">Top MCQ Scores</h3>
            <div className="mt-4 space-y-3">
              {topScores.length ? (
                topScores.map((topic) => (
                  <div key={topic.name} className="rounded-xl border border-white/10 bg-panel p-3">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm text-fg">{topic.name}</p>
                      <p className="text-sm font-semibold text-fg">{topic.score}%</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">Take a few MCQ tests to populate performance data.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-surface p-4">
            <h3 className="font-display text-lg text-fg">Priority Revision Topics</h3>
            <div className="mt-4 space-y-3">
              {weakTopics.length ? (
                weakTopics.map((topic) => (
                  <div key={topic.id} className="rounded-xl border border-white/10 bg-panel p-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-fg">{topic.name}</p>
                        <p className="mt-1 text-xs text-muted">{topic.unit}</p>
                      </div>
                      <span
                        className="rounded-full px-3 py-1 text-xs font-medium text-white"
                        style={{ backgroundColor: STATUS_COLORS[topic.status] ?? "var(--accent)" }}
                      >
                        {topic.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">Everything looks healthy right now.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-4">
      <p className="text-xs uppercase text-muted">{title}</p>
      <p className="mt-2 font-display text-2xl text-fg">{value}</p>
    </div>
  );
}
