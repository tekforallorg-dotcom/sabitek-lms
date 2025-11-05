-- Add bookmarking and timing fields to responses
ALTER TABLE sabiquiz_responses 
ADD COLUMN IF NOT EXISTS bookmarked BOOLEAN DEFAULT false;

-- Add status to attempts for resume functionality
ALTER TABLE sabiquiz_attempts 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'in_progress' 
CHECK (status IN ('in_progress', 'completed', 'abandoned'));

-- Add started_at for tracking when quiz actually began
ALTER TABLE sabiquiz_attempts 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- Create index for bookmarked questions
CREATE INDEX IF NOT EXISTS idx_sabiquiz_responses_bookmarked 
ON sabiquiz_responses(attempt_id, bookmarked) WHERE bookmarked = true;

-- Verify changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'sabiquiz_responses'
AND column_name IN ('bookmarked', 'time_seconds');

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'sabiquiz_attempts'
AND column_name IN ('status', 'started_at');