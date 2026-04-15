# GenAI Use Cases and Cloud Service Mapping

## Use Case 1: Syllabus Intelligence
- Input: Student uploads syllabus PDF.
- AI action: Claude extracts subject hierarchy (units/topics/subtopics).
- Output: Structured JSON persisted in Supabase.
- Cloud components: FastAPI backend, Anthropic API, Supabase Postgres.

## Use Case 2: MCQ Proof-Gate
- Input: Topic name.
- AI action: Claude generates 3 topic-specific MCQs with explanations.
- Output: MCQ session and scored attempts.
- Cloud components: FastAPI endpoint, Anthropic API, Supabase tables (`topics`, `mcq_attempts`).

## Use Case 3: Adaptive Study Replanning
- Input: Exam date, daily hours, progress, missed sessions.
- AI action: Claude returns revised day-wise schedule.
- Output: Updated calendar sessions in schedule storage.
- Cloud components: FastAPI endpoint, Anthropic API, Supabase `schedules`.

## Supporting Non-GenAI APIs
- YouTube Data API v3 for videos
- SerpAPI for article discovery
