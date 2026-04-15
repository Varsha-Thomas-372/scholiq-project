import { useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthModal } from "../components/AuthModal";
import { useAuth } from "../context/AuthContext";

const highlights = [
  { label: "Curriculum intelligence", value: "Complete syllabus mapping", accent: "from-cyan-400/30 to-sky-500/10" },
  { label: "Resource quality", value: "Top video and article picks", accent: "from-fuchsia-400/25 to-purple-500/10" },
  { label: "Adaptive planning", value: "Nightly schedule adjustments", accent: "from-emerald-400/25 to-teal-500/10" }
];

const featurePills = ["AI-generated study routes", "Progress visibility", "Faculty-ready cohort signals"];

export function LandingPage() {
  const [open, setOpen] = useState(false);
  const { profile, user } = useAuth();

  if (user && profile) {
    return <Navigate to={profile.role === "FACULTY" ? "/faculty" : "/home"} replace />;
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[var(--bg)] text-fg">
      <div className="grid-overlay relative min-h-screen px-6 py-10 md:px-10 md:py-12">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-8rem] top-[-5rem] h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute right-[8%] top-[12%] h-80 w-80 rounded-full bg-fuchsia-500/18 blur-3xl" />
          <div className="absolute bottom-[-5rem] left-[28%] h-72 w-72 rounded-full bg-emerald-500/12 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-col gap-8">
          <header className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-xl">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">SCHOLIQ</p>
              <p className="mt-1 text-xs text-muted">AI study OS for ambitious campuses</p>
            </div>
            <button
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-fg transition hover:bg-white/15"
              onClick={() => setOpen(true)}
              type="button"
            >
              Get started
            </button>
          </header>

          <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-surface/90 p-8 shadow-2xl shadow-black/20 backdrop-blur-2xl md:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(217,70,239,0.14),transparent_26%)]" />
            <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-muted backdrop-blur">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
                  Trusted workflows for students and faculty
                </div>
                <h1 className="mt-6 max-w-4xl font-display text-4xl font-bold leading-tight md:text-6xl">
                  Turn every syllabus into a sharper, calmer, more intelligent semester.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-muted md:text-lg">
                  One upload unlocks a focused study workspace with mapped topics, curated learning resources, adaptive practice, and faculty-facing progress insights that stay useful in real classrooms.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    className="rounded-2xl bg-accent px-6 py-3 font-semibold text-white shadow-lg shadow-accent/30 transition hover:scale-[1.01]"
                    onClick={() => setOpen(true)}
                    type="button"
                  >
                    Sign in / Sign up
                  </button>
                  <div className="rounded-2xl border border-white/12 bg-panel/80 px-5 py-3 text-sm text-muted backdrop-blur">
                    Built for actual course workflows — not static demo dashboards.
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  {featurePills.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted backdrop-blur"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[1.75rem] border border-white/10 bg-panel/90 p-5 shadow-xl shadow-black/10 backdrop-blur">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-muted">Study flow</p>
                      <p className="mt-2 font-display text-2xl text-fg">Upload → Structure → Practice → Progress</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300">
                      Always-on guidance
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    {[
                      ["Syllabus parsing", "Extract units and topics into a clean roadmap"],
                      ["Resource curation", "Find relevant videos and articles topic-wise"],
                      ["Adaptive study planning", "Adjust effort based on progress and mastery"]
                    ].map(([title, description], index) => (
                      <div key={title} className="flex gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-fg">
                          0{index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-fg">{title}</p>
                          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {highlights.map((card) => (
                    <div
                      key={card.label}
                      className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-panel/90 p-4 backdrop-blur"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${card.accent}`} />
                      <div className="relative">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-muted">{card.label}</p>
                        <p className="mt-3 font-display text-lg leading-snug text-fg">{card.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      <AuthModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}