export type UserRole = "STUDENT" | "FACULTY";

export interface TopicNode {
  name: string;
  subtopics: string[];
}

export interface UnitNode {
  unit: string;
  topics: TopicNode[];
}

export interface ParsedSyllabus {
  subject: string;
  units: UnitNode[];
  raw_text?: string;
}

export interface TopicRow {
  id: string;
  syllabus_id: string;
  unit: string;
  name: string;
  status: "pending" | "in_progress" | "done" | "flagged";
  time_spent: number;
  mcq_score: number;
}

export interface ScheduleItem {
  date: string;
  topic: string;
  estimated_hours: number;
  color: string;
}

export interface ResourceVideo {
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
  url: string;
}

export interface ResourceArticle {
  title: string;
  author: string;
  read_time: string;
  url: string;
}

export interface TopicResources {
  topic: string;
  videos: ResourceVideo[];
  articles: ResourceArticle[];
}

export interface McqQuestion {
  question: string;
  options: string[];
  answer_index: number;
  explanation: string;
}

export interface FacultyStudent {
  id: string;
  email: string;
  name: string;
  progress: number;
  flagged_count: number;
  mcq_rate: number;
  syllabus_uploaded: boolean;
  last_active: string | null;
}

export interface FacultyCohort {
  total_students: number;
  avg_completion: number;
  most_skipped_topic: string;
  cohort_readiness: number;
  students: FacultyStudent[];
}
