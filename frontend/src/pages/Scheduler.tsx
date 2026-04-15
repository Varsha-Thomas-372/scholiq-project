import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../layout/AppShell";
import { useStudentData } from "../hooks/useStudentData";
import { deleteSchedule as deleteScheduleRequest, replanSchedule } from "../api/backend";
import { supabase } from "../api/supabase";
import { useAuth } from "../context/AuthContext";

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function SchedulerPage() {
  const { user } = useAuth();
  const { topics, schedule, refresh } = useStudentData();
  const [examDate, setExamDate] = useState(schedule?.exam_date ?? "");
  const [dailyHours, setDailyHours] = useState<string>(schedule?.daily_hours ? String(schedule.daily_hours) : "2");
  const [daysOff, setDaysOff] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [deletedSchedule, setDeletedSchedule] = useState(false);

  const activeSchedule = deletedSchedule ? null : schedule;

  useEffect(() => {
    if (schedule) {
      setDeletedSchedule(false);
    }
  }, [schedule]);

  useEffect(() => {
    setExamDate(activeSchedule?.exam_date ?? "");
    setDailyHours(activeSchedule?.daily_hours ? String(activeSchedule.daily_hours) : "2");
  }, [activeSchedule?.exam_date, activeSchedule?.daily_hours]);

  const grouped = useMemo(() => {
    const map: Record<string, { topic: string; estimated_hours: number; color: string }[]> = {};
    (activeSchedule?.plan_json ?? []).forEach((item) => {
      const key = new Date(item.date).toLocaleDateString("en-US", { weekday: "long" });
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [activeSchedule?.plan_json]);

  const scheduleByDate = useMemo(() => {
    const map: Record<string, { topic: string; estimated_hours: number; color: string }[]> = {};
    (activeSchedule?.plan_json ?? []).forEach((item) => {
      const key = item.date;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [activeSchedule?.plan_json]);

  useEffect(() => {
    if (!activeSchedule || !user) return;
    const lastPlanDay = new Date(activeSchedule.updated_at).toDateString();
    const today = new Date().toDateString();
    if (lastPlanDay === today) return;
    const missedSessions = (activeSchedule.plan_json ?? [])
      .filter((item) => new Date(item.date).getTime() < Date.now())
      .map((item) => ({ topic: item.topic }));
    if (!missedSessions.length) return;
    replanSchedule({
      exam_date: activeSchedule.exam_date,
      daily_hours: activeSchedule.daily_hours,
      days_off: [],
      topics,
      missed_sessions: missedSessions
    }).then(async (plan) => {
      await supabase.from("schedules").upsert(
        {
          user_id: user.id,
          exam_date: activeSchedule.exam_date,
          daily_hours: activeSchedule.daily_hours,
          plan_json: plan
        },
        { onConflict: "user_id" }
      );
      await refresh();
    });
  }, [activeSchedule?.updated_at, user?.id, topics.length]);

  const totalTopics = topics.length;
  const totalSessions = activeSchedule?.plan_json?.length ?? 0;
  const lastUpdated = activeSchedule?.updated_at
    ? new Date(activeSchedule.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  const formattedExamDate = activeSchedule?.exam_date
    ? new Date(activeSchedule.exam_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  const hoursValue = Number(dailyHours);
  const isHoursValid = hoursValue >= 1;

  const generate = async () => {
    if (!user || !examDate || !isHoursValid) {
      setError("Please enter a valid exam date and daily hours.");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      const plan = await replanSchedule({
        exam_date: examDate,
        daily_hours: hoursValue,
        days_off: daysOff,
        topics,
        missed_sessions: []
      });
      const { error: upsertError } = await supabase.from("schedules").upsert(
        {
          user_id: user.id,
          exam_date: examDate,
          daily_hours: hoursValue,
          plan_json: plan
        },
        { onConflict: "user_id" }
      );
      if (upsertError) throw upsertError;
      setDeletedSchedule(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scheduling failed.");
    } finally {
      setGenerating(false);
    }
  };

  const deleteSchedule = async () => {
    if (!user) return;
    setDeleting(true);
    setError("");
    try {
      await deleteScheduleRequest(user.id);
      setDeletedSchedule(true);
      setExamDate("");
      setDailyHours("2");
      setDaysOff([]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete schedule.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-2">
          <h2 className="font-display text-3xl font-semibold text-fg">Generate Study Plan</h2>
          <p className="max-w-2xl text-sm text-muted">Build a weekly study schedule based on your exam date, available study time, and chosen days off.</p>
        </div>

        {activeSchedule && (
          <section className="rounded-3xl border border-white/10 bg-panel p-6 shadow-[0_30px_80px_-60px_rgba(108,99,255,0.25)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Saved exam schedule</p>
                <h3 className="text-2xl font-semibold text-fg">{formattedExamDate ?? "Exam scheduled"}</h3>
                <p className="text-sm text-muted">
                  {activeSchedule.daily_hours} hours/day · {totalSessions} study sessions planned
                </p>
                {lastUpdated && <p className="text-xs text-muted">Last updated {lastUpdated}</p>}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setExamDate(activeSchedule.exam_date);
                    setDailyHours(String(activeSchedule.daily_hours));
                    setError("");
                  }}
                  className="rounded-2xl border border-white/15 bg-surface px-4 py-2 text-sm font-medium text-fg transition hover:bg-white/5"
                >
                  Edit schedule
                </button>
                <button
                  type="button"
                  onClick={deleteSchedule}
                  disabled={deleting}
                  className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete schedule"}
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-surface p-4">
                <p className="text-sm text-muted">Exam date</p>
                <p className="mt-2 text-lg font-semibold text-fg">{formattedExamDate}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-surface p-4">
                <p className="text-sm text-muted">Daily study hours</p>
                <p className="mt-2 text-lg font-semibold text-fg">{activeSchedule.daily_hours}h/day</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-surface p-4">
                <p className="text-sm text-muted">Planned sessions</p>
                <p className="mt-2 text-lg font-semibold text-fg">{totalSessions}</p>
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-6 items-start lg:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-surface p-6 shadow-[0_30px_80px_-60px_rgba(108,99,255,0.35)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-fg">{activeSchedule ? "Edit study plan" : "Create study plan"}</h3>
                <p className="mt-1 text-sm text-muted">
                  {activeSchedule ? "Update your saved exam date or daily hours, then regenerate the plan." : "Choose your exam date and generate a plan."}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.18em] text-muted">Exam date</label>
                <input
                  type="date"
                  className="mt-2 min-w-0 w-full rounded-2xl border border-white/15 bg-panel px-4 py-3 text-fg outline-none transition focus:border-accent"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.18em] text-muted">Daily hours</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  placeholder="1"
                  className="mt-2 min-w-0 w-full rounded-2xl border border-white/15 bg-panel px-4 py-3 text-fg outline-none transition focus:border-accent"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(e.target.value.replace(/^0+(?=\d)/, ""))}
                />
              </div>
            </div>
            <div className="mt-6">
              <label className="text-xs uppercase tracking-[0.18em] text-muted">Days off</label>
              <div className="mt-3 flex flex-wrap gap-2">
                {weekDays.map((day) => {
                  const selected = daysOff.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        setDaysOff((prev) =>
                          prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]
                        );
                      }}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        selected
                          ? "bg-accent text-white shadow-[0_10px_30px_-20px_rgba(108,99,255,0.75)]"
                          : "bg-panel text-fg hover:border-white/20 hover:bg-white/5"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-muted">Tap the days you plan to rest.</p>
            </div>
            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={generate}
                disabled={generating || !examDate || !isHoursValid}
                className="w-full rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7f76ff] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
              >
                {generating ? "Saving study plan..." : activeSchedule ? "Update Study Plan" : "Generate Study Plan"}
              </button>
              {activeSchedule && (
                <button
                  type="button"
                  onClick={deleteSchedule}
                  disabled={deleting}
                  className="w-full rounded-2xl border border-white/15 bg-panel px-5 py-3 text-sm font-semibold text-fg transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              )}
            </div>
          </div>

          <aside className="self-start rounded-3xl border border-white/10 bg-panel p-6 shadow-[0_30px_80px_-60px_rgba(108,99,255,0.25)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Plan summary</p>
                <h3 className="mt-2 text-xl font-semibold text-fg">{activeSchedule ? "Saved plan available" : "Ready to generate"}</h3>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-surface p-4">
                <p className="text-sm text-muted">Topics included</p>
                <p className="mt-2 text-2xl font-semibold text-fg">{totalTopics}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-surface p-4">
                <p className="text-sm text-muted">Current settings</p>
                <p className="mt-2 text-fg">{examDate || "No exam date set"}</p>
                <p className="mt-1 text-fg">{dailyHours} hours/day</p>
              </div>
              {lastUpdated && (
                <div className="rounded-3xl border border-white/10 bg-surface p-4">
                  <p className="text-sm text-muted">Last plan refresh</p>
                  <p className="mt-2 text-fg">{lastUpdated}</p>
                </div>
              )}
            </div>
          </aside>
        </div>

        <section className="rounded-2xl border border-white/10 bg-surface p-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-display text-lg text-fg">Weekly Calendar</h3>
            <p className="text-sm text-muted">{totalSessions ? `${totalSessions} sessions scheduled` : "No sessions yet"}</p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-7">
            {weekDays.map((day) => (
              <div key={day} className="rounded-xl border border-white/10 bg-panel p-2">
                <p className="mb-2 text-xs font-semibold uppercase text-muted">{day.slice(0, 3)}</p>
                <div className="space-y-2">
                  {(grouped[day] ?? []).length ? (
                    (grouped[day] ?? []).map((session, idx) => (
                      <div key={`${day}-${idx}`} className="rounded-lg border border-white/10 bg-surface p-2 text-xs text-fg">
                        <p>{session.topic}</p>
                        <p className="text-muted">{session.estimated_hours}h</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted">No sessions</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-surface p-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-display text-lg text-fg">Saved plan details</h3>
            <p className="text-sm text-muted">{scheduleByDate.length ? `${scheduleByDate.length} study days` : "No saved plan"}</p>
          </div>
          <div className="mt-4 space-y-3">
            {scheduleByDate.length ? (
              scheduleByDate.map(([date, sessions]) => (
                <div key={date} className="rounded-2xl border border-white/10 bg-panel p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-fg">
                      {new Date(date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </p>
                    <p className="text-xs text-muted">{sessions.length} session(s)</p>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {sessions.map((session, idx) => (
                      <div key={`${date}-${session.topic}-${idx}`} className="rounded-xl border border-white/10 bg-surface p-3">
                        <p className="text-sm text-fg">{session.topic}</p>
                        <p className="mt-1 text-xs text-muted">{session.estimated_hours} hour(s)</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-panel p-6 text-sm text-muted">
                Generate a study plan to view your scheduled exam preparation sessions here.
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
