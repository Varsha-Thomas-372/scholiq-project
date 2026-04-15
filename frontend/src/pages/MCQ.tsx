import { useMemo, useState } from "react";
import { AppShell } from "../layout/AppShell";
import { useStudentData } from "../hooks/useStudentData";
import { generateMcq } from "../api/backend";
import { McqQuestion } from "../types";
import { supabase } from "../api/supabase";
import { useAuth } from "../context/AuthContext";

export function MCQPage() {
  const { user } = useAuth();
  const { topics, refresh } = useStudentData();
  const [activeTopicId, setActiveTopicId] = useState("");
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const activeTopic = useMemo(() => topics.find((t) => t.id === activeTopicId), [activeTopicId, topics]);

  const loadQuestions = async () => {
    if (!activeTopic) return;
    setLoading(true);
    setResult("");
    const generated = await generateMcq(activeTopic.name);
    setQuestions(generated);
    setAnswers(Array(generated.length).fill(-1));
    setLoading(false);
  };

  const submit = async () => {
    if (!activeTopic || !user) return;
    const correct = questions.reduce((sum, q, idx) => sum + (answers[idx] === q.answer_index ? 1 : 0), 0);
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= 67;
    await supabase.from("mcq_attempts").insert({ user_id: user.id, topic_id: activeTopic.id, score, passed });
    await supabase.from("topics").update({ status: passed ? "done" : "pending", mcq_score: score }).eq("id", activeTopic.id);
    setResult(passed ? `Passed with ${score}%. Topic unlocked.` : `Scored ${score}%. Retry needed to unlock topic.`);
    await refresh();
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(108,99,255,0.24),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.16),transparent_30%),rgba(15,23,42,0.78)] p-6 shadow-[0_30px_100px_-55px_rgba(108,99,255,0.55)] backdrop-blur-xl md:p-8">
          <div className="absolute inset-0 bg-white/[0.03]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
                Practice gate
              </span>
              <div className="space-y-2">
                <h2 className="font-display text-3xl font-semibold tracking-tight text-fg md:text-4xl">Create a fresh MCQ round in seconds</h2>
                <p className="text-sm leading-6 text-muted md:text-base">
                  Pick a syllabus topic and let SCHOLIQ spin up a focused question set to test retention before you move ahead.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.22em] text-muted">Topics ready</p>
                <p className="mt-2 font-display text-3xl text-fg">{topics.length}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.22em] text-muted">Current selection</p>
                <p className="mt-2 truncate font-medium text-fg">{activeTopic?.name ?? "Choose a topic"}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-surface/90 p-5 shadow-[0_25px_80px_-60px_rgba(14,165,233,0.45)] backdrop-blur-xl md:p-6">
          <div className="grid gap-5 lg:grid-cols-[1.4fr,0.8fr] lg:items-end">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Question generator</p>
                <h3 className="mt-2 font-display text-xl text-fg md:text-2xl">Select the concept you want to unlock</h3>
              </div>
              <label className="block">
                <span className="text-sm text-muted">Topic</span>
                <select
                  className="mt-3 w-full rounded-2xl border border-white/15 bg-panel/80 px-4 py-3 text-sm text-fg outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
                  value={activeTopicId}
                  onChange={(e) => setActiveTopicId(e.target.value)}
                >
                  <option value="">Choose a topic</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-3xl border border-white/10 bg-panel/50 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted">How it works</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-fg/90">
                <li>• Generate a new AI-powered question set for one topic.</li>
                <li>• Attempt every question and submit the gate.</li>
                <li>• Pass 67%+ to unlock the topic automatically.</li>
              </ul>
              <button
                type="button"
                onClick={loadQuestions}
                disabled={!activeTopicId || loading}
                className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7f76ff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating questions..." : "Create Questions"}
              </button>
            </div>
          </div>
        </section>

        {questions.length > 0 && (
          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Generated set</p>
                <h3 className="mt-1 font-display text-2xl text-fg">Answer all questions before submitting</h3>
              </div>
              <div className="rounded-full border border-white/10 bg-panel/60 px-4 py-2 text-sm text-muted">
                {questions.length} question{questions.length === 1 ? "" : "s"} • Topic: <span className="font-medium text-fg">{activeTopic?.name}</span>
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((q, qi) => (
                <article
                  key={q.question}
                  className="rounded-[1.75rem] border border-white/10 bg-panel/80 p-5 shadow-[0_20px_60px_-45px_rgba(108,99,255,0.45)] backdrop-blur sm:p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-sm font-semibold text-accent">
                        {qi + 1}
                      </span>
                      <p className="text-base font-medium leading-7 text-fg">{q.question}</p>
                    </div>
                    <span className="w-fit rounded-full border border-white/10 bg-surface/80 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted">
                      Single choice
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {q.options.map((opt, oi) => {
                      const selected = answers[qi] === oi;
                      return (
                        <label
                          key={opt}
                          className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                            selected
                              ? "border-accent bg-accent/10 shadow-[0_10px_30px_-20px_rgba(108,99,255,0.8)]"
                              : "border-white/10 bg-surface/80 hover:border-accent/50 hover:bg-surface"
                          }`}
                        >
                          <input
                            type="radio"
                            checked={selected}
                            onChange={() => setAnswers((prev) => prev.map((v, idx) => (idx === qi ? oi : v)))}
                            className="mt-1 h-4 w-4 accent-[var(--accent)]"
                          />
                          <span className="leading-6 text-fg">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-surface/90 p-5 shadow-[0_25px_80px_-60px_rgba(16,185,129,0.45)] backdrop-blur">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-fg">Ready to evaluate your attempt?</p>
                  <p className="text-sm text-muted">Your score will update the topic gate exactly as before.</p>
                </div>
                <button
                  type="button"
                  onClick={submit}
                  className="inline-flex items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7f76ff]"
                >
                  Submit MCQ Gate
                </button>
              </div>
              {result && (
                <p className="mt-4 rounded-2xl border border-white/10 bg-panel/60 px-4 py-3 text-sm text-fg">
                  {result}
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}