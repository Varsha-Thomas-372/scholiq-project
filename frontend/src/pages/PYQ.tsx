import { useMemo, useState } from "react";
import { Bar, BarChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "../layout/AppShell";
import { useStudentData } from "../hooks/useStudentData";

const years = [2023, 2022, 2021, 2020];

function hashFrequency(text: string, year: number) {
  const value = text.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return ((value + year) % 10) + 1;
}

export function PYQPage() {
  const { topics } = useStudentData();
  const [year, setYear] = useState(2023);

  const ranked = useMemo(
    () =>
      topics
        .map((topic) => ({ ...topic, frequency: hashFrequency(topic.name, year) }))
        .sort((a, b) => b.frequency - a.frequency),
    [topics, year]
  );

  const coverage = useMemo(() => {
    return [
      { category: "Core", value: ranked.slice(0, 5).filter((t) => t.status === "done").length * 20 },
      { category: "Applied", value: ranked.slice(5, 10).filter((t) => t.status === "done").length * 20 },
      { category: "Advanced", value: ranked.slice(10, 15).filter((t) => t.status === "done").length * 20 },
      { category: "Revision", value: ranked.filter((t) => t.status === "done").length * (100 / Math.max(1, ranked.length)) }
    ];
  }, [ranked]);

  const atRisk = ranked.filter((t) => t.frequency >= 8 && t.status !== "done");

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-fg">PYQ Analyzer</h2>
          <div className="flex gap-2">
            {years.map((y) => (
              <button key={y} onClick={() => setYear(y)} className={`rounded-lg px-3 py-1 text-sm ${year === y ? "bg-accent text-white" : "bg-panel text-fg"}`} type="button">
                {y}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-surface p-4">
            <h3 className="text-sm uppercase text-muted">Question Frequency</h3>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ranked.slice(0, 10)}>
                  <XAxis dataKey="name" hide />
                  <YAxis stroke="var(--muted)" />
                  <Tooltip />
                  <Bar dataKey="frequency" fill="var(--accent)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="rounded-2xl border border-white/10 bg-surface p-4">
            <h3 className="text-sm uppercase text-muted">Coverage Radar</h3>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={coverage}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.4} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
        <section className="rounded-2xl border border-white/10 bg-surface p-4">
          <h3 className="font-display text-lg text-fg">Topic Rank Table</h3>
          {atRisk.length > 0 && (
            <p className="mt-1 rounded-lg border border-red-300/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              At-risk alert: {atRisk.length} high-frequency uncovered topic(s) need immediate focus.
            </p>
          )}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="py-2">Topic</th>
                  <th className="py-2">Frequency</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((row) => (
                  <tr key={row.id} className="border-t border-white/10">
                    <td className="py-2 text-fg">{row.name}</td>
                    <td className="py-2 text-fg">{row.frequency}</td>
                    <td className="py-2">
                      <span className="rounded-full border border-white/15 px-2 py-1 text-xs text-fg">{row.status}</span>
                    </td>
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
