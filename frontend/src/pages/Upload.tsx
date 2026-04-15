import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import { parseSyllabus, listSyllabuses } from "../api/backend";
import { supabase } from "../api/supabase";
import { useAuth } from "../context/AuthContext";
import { AppShell } from "../layout/AppShell";

export function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [syllabi, setSyllabi] = useState<{ id: string; subject: string; uploaded_at: string }[]>([]);
  const [activeSyllabusId, setActiveSyllabusId] = useState(localStorage.getItem("activeSyllabusId") || "");

  useEffect(() => {
    if (user) {
      listSyllabuses(user.id).then(setSyllabi).catch(() => {});
    }
  }, [user]);

  const onSyllabusSwitch = (id: string) => {
    setActiveSyllabusId(id);
    localStorage.setItem("activeSyllabusId", id);
    const syllabus = syllabi.find(s => s.id === id);
    if (syllabus) {
      alert(`Switched to: ${syllabus.subject}`);
    }
  };

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0];
      if (!file || !user) return;
      setLoading(true);
      setError("");
      try {
        const parsed = await parseSyllabus(file);
        
        // Extract filename without extension as the syllabus name
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        const syllabusName = fileName.trim() || parsed.subject;
        
        // Insert new syllabus (keep old ones for reference)—multi-upload enabled
        const { data: syllabiData, error: syllabusError } = await supabase
          .from("syllabi")
          .insert({
            user_id: user.id,
            subject: syllabusName,
            raw_text: parsed.raw_text,
            parsed_json: { subject: syllabusName, units: parsed.units }
          })
          .select("id")
          .single();
        if (syllabusError) throw syllabusError;
        const newId = syllabiData.id as string;
        
        // Refresh list
        listSyllabuses(user.id).then(setSyllabi);
        setActiveSyllabusId(newId); // Auto-switch to new
        localStorage.setItem("activeSyllabusId", newId);
        
        // Insert topics for this syllabus
        const topicRows = parsed.units.flatMap((unit: { unit: string; topics: { name: string }[] }) =>
          unit.topics.map((topic) => ({
            syllabus_id: newId,
            unit: unit.unit,
            name: topic.name,
            status: "pending",
            time_spent: 0,
            mcq_score: 0
          }))
        );
        if (topicRows.length) {
          const { error: topicsError } = await supabase.from("topics").insert(topicRows);
          if (topicsError) throw topicsError;
        }
        navigate("/resources");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed.";
        if (message.toLowerCase().includes("cannot reach backend") || message.toLowerCase().includes("failed to fetch")) {
          setError("Unable to connect to the backend. Please confirm FastAPI is running on http://127.0.0.1:8000 and try again.");
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    },
    [user?.id, syllabi]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1
  });

  return (
    <AppShell>
      <div className="grid-overlay rounded-3xl border border-white/10 bg-surface p-6 md:p-10 shadow-2xl">
        <div className="max-w-3xl space-y-4">
          <h2 className="font-display text-3xl font-semibold text-fg">Upload Syllabus</h2>
          <p className="max-w-xl text-base leading-7 text-muted">
            Upload a PDF syllabus to create a structured study roadmap. SCHOLIQ supports multiple syllabi—switch below or upload new. (Core Fix 2)
          </p>
          {syllabi.length > 0 && (
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-muted">Active Syllabus:</label>
              <select 
                value={activeSyllabusId} 
                onChange={(e) => onSyllabusSwitch(e.target.value)} 
                className="w-full rounded-lg border border-white/20 bg-panel p-3 text-fg focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                {syllabi.map((s) => (
                  <option key={s.id} value={s.id}>{s.subject} ({new Date(s.uploaded_at).toLocaleDateString()})</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div
          {...getRootProps()}
          className={`mt-8 grid min-h-64 place-items-center rounded-3xl border border-dashed p-8 text-center transition ${isDragActive ? "border-accent bg-accent/10" : "border-white/20 bg-panel"}`}
        >
          <input {...getInputProps()} />
          <div className="max-w-md space-y-3">
            <p className="text-lg font-semibold text-fg">{loading ? "Extracting syllabus..." : "Drop PDF here or click to browse"}</p>
            <p className="text-sm leading-6 text-muted">Accepted format: PDF. We only need the syllabus file to begin.</p>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
