-- Azure SQL Database Schema (converted from Supabase Postgres)
-- Run on Azure SQL DB creation or via init script

-- Users table
CREATE TABLE users (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  email NVARCHAR(255) NOT NULL UNIQUE,
  role NVARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'FACULTY')),
  [name] NVARCHAR(255),
  created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Syllabi table
CREATE TABLE syllabi (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
  subject NVARCHAR(255) NOT NULL,
  raw_text NVARCHAR(MAX) NOT NULL,
  parsed_json NVARCHAR(MAX) NOT NULL,
  uploaded_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Topics table
CREATE TABLE topics (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  syllabus_id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES syllabi(id) ON DELETE CASCADE,
  unit NVARCHAR(255) NOT NULL,
  [name] NVARCHAR(255) NOT NULL,
  status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'flagged')),
  time_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
  mcq_score DECIMAL(5,2) NOT NULL DEFAULT 0
);

-- Schedules table
CREATE TABLE schedules (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL UNIQUE FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  daily_hours DECIMAL(5,2) NOT NULL,
  plan_json NVARCHAR(MAX) NOT NULL DEFAULT '[]',
  updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- MCQ Attempts table
CREATE TABLE mcq_attempts (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
  topic_id UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES topics(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  passed BIT NOT NULL,
  attempted_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Indexes for performance
CREATE INDEX IX_syllabi_user_id ON syllabi(user_id);
CREATE INDEX IX_topics_syllabus_id ON topics(syllabus_id);
CREATE INDEX IX_schedules_user_id ON schedules(user_id);
CREATE INDEX IX_mcq_attempts_user_id ON mcq_attempts(user_id);
CREATE INDEX IX_mcq_attempts_topic_id ON mcq_attempts(topic_id);

PRINT 'SCHOLIQ Azure SQL schema created successfully.';

