-- Create table for storing lesson summaries
CREATE TABLE IF NOT EXISTS lesson_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lesson_id)
);

-- Create table for tracking questions asked
CREATE TABLE IF NOT EXISTS lesson_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  asked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for Q&A history
CREATE TABLE IF NOT EXISTS lesson_qa_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  helpful BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE lesson_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_qa_history ENABLE ROW LEVEL SECURITY;

-- Policies for lesson_summaries (public read)
CREATE POLICY "Anyone can view summaries" 
  ON lesson_summaries FOR SELECT 
  USING (true);

CREATE POLICY "System can insert summaries" 
  ON lesson_summaries FOR INSERT 
  WITH CHECK (true);

-- Policies for lesson_questions
CREATE POLICY "Users can view their questions" 
  ON lesson_questions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can ask questions" 
  ON lesson_questions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policies for lesson_qa_history
CREATE POLICY "Users can view their Q&A history" 
  ON lesson_qa_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create Q&A entries" 
  ON lesson_qa_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can rate their Q&A" 
  ON lesson_qa_history FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_lesson_summaries_lesson_id ON lesson_summaries(lesson_id);
CREATE INDEX idx_lesson_questions_lesson_id ON lesson_questions(lesson_id);
CREATE INDEX idx_lesson_questions_user_id ON lesson_questions(user_id);
CREATE INDEX idx_lesson_qa_history_lesson_id ON lesson_qa_history(lesson_id);
CREATE INDEX idx_lesson_qa_history_user_id ON lesson_qa_history(user_id);