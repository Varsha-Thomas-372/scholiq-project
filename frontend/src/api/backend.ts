import { McqQuestion, ParsedSyllabus, ScheduleItem, TopicResources, TopicRow } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

if (!API_BASE_URL) {
  throw new Error("Missing VITE_API_BASE_URL.");
}

function candidateBaseUrls() {
  const urls = ["/api", API_BASE_URL];
  if (API_BASE_URL.includes("127.0.0.1")) {
    urls.push(API_BASE_URL.replace("127.0.0.1", "localhost"));
  } else if (API_BASE_URL.includes("localhost")) {
    urls.push(API_BASE_URL.replace("localhost", "127.0.0.1"));
  }
  return [...new Set(urls)];
}

async function fetchWithFallback(path: string, init?: RequestInit) {
  let lastError: string = "";
  for (const base of candidateBaseUrls()) {
    try {
      const res = await fetch(`${base}${path}`, init);
      return res;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Network request failed.";
    }
  }
  throw new Error(`Cannot reach backend service. Ensure FastAPI is running and try again. (${lastError})`);
}

async function parseErrorResponse(res: Response, fallbackMessage: string) {
  const text = await res.text();
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const json = JSON.parse(text);
      return (json.detail || json.message || text || fallbackMessage) as string;
    } catch {
      return text || fallbackMessage;
    }
  }
  return text || fallbackMessage;
}

async function handleResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
  if (res.ok) {
    return res.json();
  }
  const message = await parseErrorResponse(res, fallbackMessage);
  throw new Error(message);
}

export async function parseSyllabus(file: File) {
  const body = new FormData();
  body.append("file", file);
  const res = await fetchWithFallback("/parse-syllabus", { method: "POST", body });
  return handleResponse<ParsedSyllabus>(res, "Unable to upload the syllabus.");
}

export async function fetchResources(topic: string): Promise<TopicResources> {
  const res = await fetchWithFallback(`/resources/${encodeURIComponent(topic)}`);
  return handleResponse(res, "Failed to fetch resources.");
}

export async function generateMcq(topic: string): Promise<McqQuestion[]> {
  const res = await fetchWithFallback("/generate-mcq", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic })
  });
  const data = await handleResponse<{ questions: McqQuestion[] }>(res, "Unable to create questions.");
  return data.questions as McqQuestion[];
}

export async function replanSchedule(payload: {
  exam_date: string;
  daily_hours: number;
  days_off: string[];
  topics: TopicRow[];
  missed_sessions: { topic: string }[];
}): Promise<ScheduleItem[]> {
  const res = await fetchWithFallback("/replan-schedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await handleResponse<{ plan: ScheduleItem[] }>(res, "Unable to generate study plan.");
  return data.plan as ScheduleItem[];
}

export async function deleteSchedule(userId: string) {
  const res = await fetchWithFallback(`/schedule?user_id=${encodeURIComponent(userId)}`, {
    method: "DELETE"
  });
  return handleResponse<{ ok: boolean }>(res, "Unable to delete schedule.");
}

export async function deleteSyllabus(syllabusId: string, userId: string) {
  const res = await fetchWithFallback(`/syllabi/${encodeURIComponent(syllabusId)}?user_id=${encodeURIComponent(userId)}`, {
    method: "DELETE"
  });
  return handleResponse<{ ok: boolean; schedule_deleted?: boolean }>(res, "Unable to delete syllabus.");
}

export async function createProfile(payload: {
  user_id: string;
  email: string;
  role: "STUDENT" | "FACULTY";
  name?: string;
}) {
  const res = await fetchWithFallback("/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error("Failed to create user profile.");
  }
  return res.json();
}

export async function listSyllabuses(userId: string) {
  const res = await fetchWithFallback(`/syllabi?user_id=${encodeURIComponent(userId)}`);
  const data = await handleResponse<{ syllabi: { id: string; subject: string; uploaded_at: string }[] }>(res, "Failed to list syllabi.");
  return data.syllabi;
}

export async function getFacultyCohort() {
  const res = await fetchWithFallback("/faculty/cohort");
  if (!res.ok) {
    throw new Error("Failed to load faculty cohort.");
  }
  return res.json();
}
