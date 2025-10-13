-- Check what columns exist in quizzes table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'quizzes'
ORDER BY ordinal_position;

-- Add the questions column if it doesn't exist
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS questions JSONB DEFAULT '[]'::jsonb;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quizzes' 
AND column_name = 'questions';