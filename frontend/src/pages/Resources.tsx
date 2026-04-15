import { useState } from "react";
import { Link } from "react-router-dom";
import { fetchResources } from "../api/backend";
import { AppShell } from "../layout/AppShell";
import { useStudentData } from "../hooks/useStudentData";
import { TopicResources } from "../types";

export function ResourcesPage() {
  const { syllabusId, syllabus, syllabusLibrary, switchSyllabus, deleteSyllabus, deletingSyllabusId } = useStudentData();
  const [expandedUnits, setExpandedUnits] = useState<string[]>([]);
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [resources, setResources] = useState<Record<string, TopicResources>>({});
  const [loadingTopic, setLoadingTopic] = useState("");

  if (!syllabus) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-white/10 bg-surface p-8">
          <p className="text-fg">You need to upload your syllabus first.</p>
          <Link to="/upload" className="mt-4 inline-block rounded-xl bg-accent px-4 py-2 text-white">
            Go to Upload
          </Link>
        </div>
      </AppShell>
    );
  }

  const toggleTopic = async (topic: string) => {
    setExpandedTopics((prev) => (prev.includes(topic) ? prev.filter((item) => item !== topic) : [...prev, topic]));
    if (resources[topic]) return;
    try {
      setLoadingTopic(topic);
      const data = await fetchResources(topic);
      setResources((prev) => ({ ...prev, [topic]: data }));
    } finally {
      setLoadingTopic("");
    }
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl text-fg">Resource Hub</h2>
            <p className="text-muted">Explore your curriculum with curated learning media for every topic.</p>
          </div>
          <div className="flex gap-2">
            {syllabusLibrary.length > 0 && (
              <button
                onClick={() => setShowLibrary(!showLibrary)}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-fg transition hover:border-accent"
              >
                Library ({syllabusLibrary.length})
              </button>
            )}
            <Link to="/upload" className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent/90">
              Upload fresh syllabus
            </Link>
          </div>
        </div>

        {showLibrary && syllabusLibrary.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-panel p-4">
            <h3 className="mb-3 font-medium text-fg">Your Syllabus Library</h3>
            <div className="space-y-2">
              {syllabusLibrary.map((item) => (
                <div key={item.id} className="grid gap-3 rounded-lg border border-white/10 bg-surface p-3 md:grid-cols-[1fr_auto]">
                  <button
                    onClick={() => {
                      switchSyllabus(item.id);
                      setShowLibrary(false);
                    }}
                    className={`w-full rounded-lg p-3 text-left transition ${
                      syllabusId === item.id
                        ? "border border-accent bg-accent/10"
                        : "border border-white/10 bg-surface hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-fg">{item.subject}</p>
                        <p className="text-xs text-muted">{item.topicCount} topics</p>
                      </div>
                      <p className="text-xs text-muted">{new Date(item.uploaded_at).toLocaleDateString()}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-fit items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
                    onClick={async () => {
                      const lastSyllabus = syllabusLibrary.length === 1;
                      const confirmDelete = window.confirm(
                        lastSyllabus
                          ? `Delete syllabus '${item.subject}' and remove its scheduler data?`
                          : `Delete syllabus '${item.subject}' and its topics?`
                      );
                      if (!confirmDelete) return;
                      await deleteSyllabus(item.id);
                    }}
                    disabled={deletingSyllabusId === item.id}
                  >
                    {deletingSyllabusId === item.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-panel p-4 text-sm text-muted">
          <p>
            <span className="font-medium text-fg">Course:</span> {syllabus.subject}
          </p>
          <p className="mt-1">
            <span className="font-medium text-fg">Units:</span> {syllabus.units.length} · <span className="font-medium text-fg">Topics:</span>{" "}
            {syllabus.units.reduce((sum, unit) => sum + unit.topics.length, 0)}
          </p>
        </div>
        {syllabus.units.map((unit) => {
          const open = expandedUnits.includes(unit.unit);
          return (
            <section key={unit.unit} className="rounded-2xl border border-white/10 bg-surface">
              <button
                className="flex w-full items-center justify-between px-4 py-3 text-left text-fg"
                type="button"
                onClick={() => setExpandedUnits((prev) => (open ? prev.filter((u) => u !== unit.unit) : [...prev, unit.unit]))}
              >
                <span className="font-display text-lg">{unit.unit}</span>
                <span className="text-sm text-muted">{open ? "Collapse" : "Expand"}</span>
              </button>
              {open && (
                <div className="space-y-3 border-t border-white/10 p-4">
                  {unit.topics.map((topic) => {
                    const topicOpen = expandedTopics.includes(topic.name);
                    const data = resources[topic.name];
                    return (
                      <article key={topic.name} className="rounded-2xl border border-white/10 bg-panel p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-fg">{topic.name}</h3>
                            {topic.subtopics?.length ? (
                              <div className="mt-2 space-y-1 text-sm text-muted">
                                <p className="font-medium text-fg">Subtopics:</p>
                                <ul className="list-disc pl-5">
                                  {topic.subtopics.map((subtopic) => (
                                    <li key={subtopic}>{subtopic}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <p className="mt-2 text-sm text-muted">Parsed topic has no subtopics.</p>
                            )}
                          </div>
                          <button
                            className="rounded-full border border-white/10 bg-surface px-4 py-2 text-sm text-fg transition hover:border-accent"
                            onClick={() => toggleTopic(topic.name)}
                            type="button"
                          >
                            {topicOpen ? "Hide resources" : "Show resources"}
                          </button>
                        </div>
                        {topicOpen && (
                          <div className="mt-4 space-y-4">
                            {loadingTopic === topic.name && <p className="text-sm text-muted">Fetching live links...</p>}
                            {data ? (
                              <>
                                <div>
                                  <h4 className="font-medium text-fg">YouTube Videos</h4>
                                  {data.videos.length ? (
                                    <div className="mt-2 grid gap-3 md:grid-cols-3">
                                      {data.videos.map((video) => (
                                        <a key={video.url} href={video.url} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-surface p-2 hover:border-accent">
                                          <img src={video.thumbnail} alt={video.title} className="h-28 w-full rounded-lg object-cover" />
                                          <p className="mt-2 text-sm text-fg">{video.title}</p>
                                          <p className="text-xs text-muted">
                                            {video.channel} · {video.duration}
                                          </p>
                                        </a>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="mt-2 text-sm text-muted">No videos found for this topic yet.</p>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium text-fg">Articles</h4>
                                  {data.articles.length ? (
                                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                                      {data.articles.map((article) => (
                                        <a key={article.url} href={article.url} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-surface p-3 hover:border-accent">
                                          <p className="text-sm text-fg">{article.title}</p>
                                          <p className="mt-1 text-xs text-muted">
                                            {article.author} · {article.read_time}
                                          </p>
                                        </a>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="mt-2 text-sm text-muted">No articles found for this topic yet.</p>
                                  )}
                                </div>
                              </>
                            ) : (
                              <p className="text-sm text-muted">Open a topic to load recommended resources.</p>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
