import { supabase } from '@/lib/supabase'
import type { Question, QuestionCounts, DifficultyLevel } from './types'

export interface QuizAttempt {
  id: string
  user_id: string
  material_id: string
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
  total_questions: number
  correct_answers: number
  score: number
  completed_at: string | null
  created_at: string
}

export interface QuizResponse {
  id: string
  attempt_id: string
  question_id: string
  selected_answer: number
  correct: boolean
  time_seconds: number
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Shuffle question options and update correct answer index
 */
function shuffleQuestionOptions(question: Question): Question {
  const optionsWithIndex = question.options.map((option, index) => ({
    option,
    wasCorrect: index === question.correct_answer,
  }))

  const shuffled = shuffleArray(optionsWithIndex)

  return {
    ...question,
    options: shuffled.map(item => item.option),
    correct_answer: shuffled.findIndex(item => item.wasCorrect),
  }
}

export async function createQuizAttempt(
  materialId: string,
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed',
  questionCount: number = 10,
  questionIds: string[] = []
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('sabiquiz_attempts')
    .insert({
      user_id: user.id,
      material_id: materialId,
      title: `Quiz - ${new Date().toLocaleDateString()}`,
      category: '',
      difficulty: difficulty === 'mixed' ? null : difficulty,
      total_questions: questionCount,
      question_ids: questionIds,
      correct_answers: 0,
      score: 0,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating quiz attempt:', error)
    throw new Error('Failed to create quiz attempt')
  }

  return data.id
}

export async function getQuizQuestions(
  materialId: string,
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed',
  limit: number = 10
): Promise<Question[]> {
  let query = supabase
    .from('sabiquiz_questions')
    .select('*')
    .eq('material_id', materialId)
    .eq('status', 'approved')

  if (difficulty !== 'mixed') {
    query = query.eq('difficulty', difficulty)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching questions:', error)
    throw new Error('Failed to fetch questions')
  }

  if (!data || data.length === 0) {
    throw new Error('No questions available for this material')
  }

  // 1. Shuffle questions
  const shuffledQuestions = shuffleArray(data)

  // 2. Take only the limit we need
  const selectedQuestions = shuffledQuestions.slice(0, limit)

  // 3. Shuffle answer options for each question
  const questionsWithShuffledOptions = selectedQuestions.map(shuffleQuestionOptions)

  console.log(`🎲 Randomized ${questionsWithShuffledOptions.length} questions with shuffled options`)

  return questionsWithShuffledOptions
}

export async function submitAnswer(
  attemptId: string,
  questionId: string,
  selectedAnswer: number,
  correctAnswer: number,
  timeSeconds: number
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  const isCorrect = selectedAnswer === correctAnswer

  const { error } = await supabase
    .from('sabiquiz_responses')
    .insert({
      attempt_id: attemptId,
      question_id: questionId,
      user_id: user.id,
      selected_answer: selectedAnswer,
      correct: isCorrect,
      time_seconds: timeSeconds,
    })

  if (error) {
    console.error('Error submitting answer:', error)
    throw new Error('Failed to submit answer')
  }
}

export async function completeQuiz(attemptId: string): Promise<{
  score: number
  correctAnswers: number
  totalQuestions: number
}> {
  const { data: responses, error: responsesError } = await supabase
    .from('sabiquiz_responses')
    .select('correct')
    .eq('attempt_id', attemptId)

  if (responsesError) {
    throw new Error('Failed to fetch responses')
  }

  const correctAnswers = responses?.filter(r => r.correct).length || 0
  const totalQuestions = responses?.length || 0
  const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0

  const { error: updateError } = await supabase
    .from('sabiquiz_attempts')
    .update({
      correct_answers: correctAnswers,
      score: Math.round(score),
      completed_at: new Date().toISOString(),
    })
    .eq('id', attemptId)

  if (updateError) {
    throw new Error('Failed to update quiz attempt')
  }

  return {
    score: Math.round(score),
    correctAnswers,
    totalQuestions,
  }
}

export async function getQuizAttempt(attemptId: string): Promise<QuizAttempt | null> {
  const { data, error } = await supabase
    .from('sabiquiz_attempts')
    .select('*')
    .eq('id', attemptId)
    .single()

  if (error) {
    console.error('Error fetching attempt:', error)
    return null
  }

  return data
}

export async function getQuestionCounts(materialId: string): Promise<QuestionCounts> {
  const { data, error } = await supabase
    .from('sabiquiz_questions')
    .select('difficulty')
    .eq('material_id', materialId)
    .eq('status', 'approved')

  if (error) {
    console.error('Error fetching question counts:', error)
    throw error
  }

  const counts: QuestionCounts = {
    easy: 0,
    medium: 0,
    hard: 0,
    total: 0,
  }

  data?.forEach((q) => {
    if (q.difficulty === 'easy') counts.easy++
    else if (q.difficulty === 'medium') counts.medium++
    else if (q.difficulty === 'hard') counts.hard++
    counts.total++
  })

  return counts
}

export async function getAttemptResponses(attemptId: string): Promise<QuizResponse[]> {
  const { data, error } = await supabase
    .from('sabiquiz_responses')
    .select('*')
    .eq('attempt_id', attemptId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching responses:', error)
    throw error
  }

  return data || []
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}