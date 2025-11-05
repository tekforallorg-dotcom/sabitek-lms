-- Approve all generated questions so they can be used in quizzes
UPDATE sabiquiz_questions 
SET status = 'approved' 
WHERE status IS NULL OR status = 'pending';

-- Verify the update
SELECT 
  material_id,
  difficulty,
  status,
  COUNT(*) as count
FROM sabiquiz_questions
GROUP BY material_id, difficulty, status
ORDER BY material_id, difficulty;