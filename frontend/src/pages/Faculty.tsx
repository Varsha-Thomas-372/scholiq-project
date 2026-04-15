import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getFacultyCohort } from "../api/backend";
import { AppShell } from "../layout/AppShell";
import { FacultyCohort } from "../types";

export function FacultyPage() {
  const [data, setData] = useState<FacultyCohort | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    getFacultyCohort().then(setData).catch(() => undefined);
  }, []);

  return (
    <AppShell>
      <div className="space-y-4">
        <h2 className="font-display text-2xl text-fg">Faculty Dashboard</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Stat title="Total Students" value={String(data?.total_students ?? 0)} />
          <Stat title="Avg Completion" value={`${data?.avg_completion ?? 0}%`} />
          <Stat title="Most Skipped Topic" value={data?.most_skipped_topic ?? "No data"} />
          <Stat title="Readiness Score" value={`${data?.cohort_readiness ?? 0}%`} />
        </div>
        <section className="rounded-2xl border border-white/10 bg-surface p-4">
          <h3 className="font-display text-lg text-fg">Cohort Completion Chart</h3>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.students ?? []}>
                <XAxis dataKey="name" hide />
                <YAxis stroke="var(--muted)" />
                <Tooltip />
                <Bar dataKey="progress" fill="var(--accent)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="rounded-2xl border border-white/10 bg-surface p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg text-fg">Student Table</h3>
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by name or email" className="rounded-xl border border-white/15 bg-panel px-3 py-2 text-sm text-fg" />
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="py-2">Name</th>
                  <th className="py-2">Syllabus</th>
                  <th className="py-2">Progress</th>
                  <th className="py-2">Flagged</th>
                  <th className="py-2">MCQ Rate</th>
                  <th className="py-2">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {(data?.students ?? [])
                  .filter((row) => `${row.name} ${row.email}`.toLowerCase().includes(filter.toLowerCase()))
                  .map((row) => (
                    <tr key={row.id} className="border-t border-white/10">
                      <td className="py-2 text-fg">{row.name || row.email}</td>
                      <td className="py-2 text-fg">{row.syllabus_uploaded ? "Yes" : "No"}</td>
                      <td className="py-2 text-fg">{row.progress}%</td>
                      <td className="py-2 text-fg">{row.flagged_count}</td>
                      <td className="py-2 text-fg">{row.mcq_rate}%</td>
                      <td className="py-2 text-muted">{row.last_active ? new Date(row.last_active).toLocaleDateString() : "N/A"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-4">
      <p className="text-xs uppercase text-muted">{title}</p>
      <p className="mt-2 font-display text-xl text-fg">{value}</p>
    </div>
  );
}
