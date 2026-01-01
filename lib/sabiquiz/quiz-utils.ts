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

  const shuffledQuestions = shuffleArray(data)
  const selectedQuestions = shuffledQuestions.slice(0, limit)
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

// ============================================================================
// STREAK & MASTERY UPDATES
// ============================================================================

/**
 * Update user's study streak after completing a quiz
 */
export async function updateStreak(userId: string): Promise<{
  currentStreak: number
  longestStreak: number
  isNewDay: boolean
}> {
  const today = new Date().toISOString().split('T')[0]

  const { data: existing, error: fetchError } = await supabase
    .from('study_streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchError) {
    console.error('Error fetching streak:', fetchError)
    throw fetchError
  }

  let currentStreak = 1
  let longestStreak = 1
  let totalStudyDays = 1
  let isNewDay = true

  if (existing) {
    const lastStudyDate = existing.last_study_date
    
    if (lastStudyDate === today) {
      isNewDay = false
      return {
        currentStreak: existing.current_streak || 1,
        longestStreak: existing.longest_streak || 1,
        isNewDay: false,
      }
    }

    const lastDate = new Date(lastStudyDate)
    const todayDate = new Date(today)
    const diffTime = todayDate.getTime() - lastDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      currentStreak = (existing.current_streak || 0) + 1
    } else if (diffDays > 1) {
      const missedDays = diffDays - 1
      const decayAmount = Math.max(0, missedDays - 1)
      currentStreak = Math.max(1, (existing.current_streak || 1) - decayAmount)
    }

    longestStreak = Math.max(existing.longest_streak || 1, currentStreak)
    totalStudyDays = (existing.total_study_days || 0) + 1
  }

  const { error: upsertError } = await supabase
    .from('study_streaks')
    .upsert({
      user_id: userId,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_study_date: today,
      total_study_days: totalStudyDays,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })

  if (upsertError) {
    console.error('Error updating streak:', upsertError)
    throw upsertError
  }

  console.log(`🔥 Streak updated: ${currentStreak} days (best: ${longestStreak})`)

  return { currentStreak, longestStreak, isNewDay }
}

/**
 * Update topic mastery based on quiz responses
 */
export async function updateMastery(
  userId: string,
  attemptId: string
): Promise<{ updatedTopics: string[]; weakTopics: string[] }> {
  const { data: responses, error: responsesError } = await supabase
    .from('sabiquiz_responses')
    .select(`
      correct,
      question_id,
      sabiquiz_questions!question_id (
        topic,
        category,
        difficulty
      )
    `)
    .eq('attempt_id', attemptId)

  if (responsesError) {
    console.error('Error fetching responses for mastery:', responsesError)
    throw responsesError
  }

  if (!responses || responses.length === 0) {
    return { updatedTopics: [], weakTopics: [] }
  }

  const topicStats = new Map<string, { correct: number; total: number; category: string }>()

  responses.forEach((r: any) => {
    const topic = r.sabiquiz_questions?.topic || 'General'
    const category = r.sabiquiz_questions?.category || 'General'
    
    if (!topicStats.has(topic)) {
      topicStats.set(topic, { correct: 0, total: 0, category })
    }
    
    const stats = topicStats.get(topic)!
    stats.total++
    if (r.correct) {
      stats.correct++
    }
  })

  const updatedTopics: string[] = []
  const weakTopics: string[] = []

  for (const [topic, stats] of topicStats) {
    const { data: existing } = await supabase
      .from('sabiquiz_mastery')
      .select('*')
      .eq('user_id', userId)
      .eq('topic', topic)
      .maybeSingle()

    const newTotalAttempts = (existing?.total_attempts || 0) + stats.total
    const newCorrectAttempts = (existing?.correct_attempts || 0) + stats.correct
    const newMasteryPercentage = Math.round((newCorrectAttempts / newTotalAttempts) * 100)

    const { error: upsertError } = await supabase
      .from('sabiquiz_mastery')
      .upsert({
        user_id: userId,
        topic,
        category: stats.category,
        total_attempts: newTotalAttempts,
        correct_attempts: newCorrectAttempts,
        mastery_percentage: newMasteryPercentage,
        last_practiced: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,topic',
      })

    if (upsertError) {
      console.error(`Error updating mastery for ${topic}:`, upsertError)
      continue
    }

    updatedTopics.push(topic)
    
    if (newMasteryPercentage < 60 && newTotalAttempts >= 3) {
      weakTopics.push(topic)
    }
  }

  console.log(`📊 Mastery updated for ${updatedTopics.length} topics`)

  return { updatedTopics, weakTopics }
}

/**
 * Combined function to update both streak and mastery after quiz completion
 */
export async function updateStreakAndMastery(
  userId: string,
  attemptId: string
): Promise<{
  streak: { currentStreak: number; longestStreak: number; isNewDay: boolean }
  mastery: { updatedTopics: string[]; weakTopics: string[] }
}> {
  try {
    const [streakResult, masteryResult] = await Promise.all([
      updateStreak(userId),
      updateMastery(userId, attemptId),
    ])

    return { streak: streakResult, mastery: masteryResult }
  } catch (error) {
    console.error('Error updating streak and mastery:', error)
    return {
      streak: { currentStreak: 0, longestStreak: 0, isNewDay: false },
      mastery: { updatedTopics: [], weakTopics: [] },
    }
  }
}

/**
 * Get user's weak topics for retry functionality
 */
export async function getWeakTopics(userId: string, limit: number = 5): Promise<{
  topic: string
  category: string
  mastery_percentage: number
  total_attempts: number
}[]> {
  const { data, error } = await supabase
    .from('sabiquiz_mastery')
    .select('topic, category, mastery_percentage, total_attempts')
    .eq('user_id', userId)
    .lt('mastery_percentage', 60)
    .gte('total_attempts', 3)
    .order('mastery_percentage', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching weak topics:', error)
    return []
  }

  return data || []
}

/**
 * Get wrong question IDs from an attempt for retry
 */
export async function getWrongQuestionIds(attemptId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('sabiquiz_responses')
    .select('question_id, correct')
    .eq('attempt_id', attemptId)

  if (error) {
    console.error('Error fetching wrong questions:', error)
    return []
  }

  // Filter for incorrect OR unanswered (correct === false OR correct === null)
 // Filter for incorrect OR unanswered (correct === false OR correct === null)
  const wrongIds = data
    ?.filter(r => r.correct === false || r.correct === null)
    ?.map(r => r.question_id) || []

  console.log(`📝 Found ${wrongIds.length} wrong/unanswered questions out of ${data?.length || 0} total`)

  return wrongIds
}

/**
 * Get questions by IDs for retry wrong only
 */
export async function getQuestionsByIds(questionIds: string[]): Promise<Question[]> {
  if (questionIds.length === 0) return []

  const { data, error } = await supabase
    .from('sabiquiz_questions')
    .select('*')
    .in('id', questionIds)

  if (error) {
    console.error('Error fetching questions by IDs:', error)
    return []
  }

  const shuffled = shuffleArray(data || [])
  return shuffled.map(shuffleQuestionOptions)
}

/**
 * Get questions for weak topics retry
 */
export async function getWeakTopicQuestions(
  userId: string,
  limit: number = 10
): Promise<Question[]> {
  const weakTopics = await getWeakTopics(userId)
  
  if (weakTopics.length === 0) {
    return []
  }

  const topicNames = weakTopics.map(t => t.topic)

  const { data, error } = await supabase
    .from('sabiquiz_questions')
    .select('*')
    .in('topic', topicNames)
    .eq('status', 'approved')
    .limit(limit * 2)

  if (error) {
    console.error('Error fetching weak topic questions:', error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  const shuffled = shuffleArray(data)
  return shuffled.slice(0, limit).map(shuffleQuestionOptions)
}

// ============================================================================
// XP & BADGES SYSTEM
// ============================================================================

const XP_VALUES = {
  CORRECT_ANSWER: 10,
  QUIZ_COMPLETE: 25,
  IMPROVEMENT_BONUS: 15, // When score improves on same topic
  STREAK_BONUS: 5, // Per day of streak
  PERFECT_SCORE: 50,
}

const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, // Levels 1-10
  17000, 23000, 30000, 40000, 52000, 67000, 85000, 107000, 135000, 170000, // Levels 11-20
]

function calculateLevel(totalXp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      return i + 1
    }
  }
  return 1
}

/**
 * Award XP to user after quiz completion
 */
export async function awardXP(
  userId: string,
  attemptId: string,
  correctAnswers: number,
  totalQuestions: number,
  currentStreak: number
): Promise<{ xpEarned: number; newTotal: number; newLevel: number; leveledUp: boolean }> {
  
  // Calculate XP earned
  let xpEarned = 0
  const xpSources: { amount: number; source: string }[] = []

  // XP for correct answers
  const correctXP = correctAnswers * XP_VALUES.CORRECT_ANSWER
  xpEarned += correctXP
  xpSources.push({ amount: correctXP, source: 'correct_answer' })

  // XP for completing quiz
  xpEarned += XP_VALUES.QUIZ_COMPLETE
  xpSources.push({ amount: XP_VALUES.QUIZ_COMPLETE, source: 'quiz_complete' })

  // Bonus for perfect score
  if (correctAnswers === totalQuestions && totalQuestions > 0) {
    xpEarned += XP_VALUES.PERFECT_SCORE
    xpSources.push({ amount: XP_VALUES.PERFECT_SCORE, source: 'perfect_score' })
  }

  // Streak bonus
  if (currentStreak > 1) {
    const streakBonus = Math.min(currentStreak, 7) * XP_VALUES.STREAK_BONUS
    xpEarned += streakBonus
    xpSources.push({ amount: streakBonus, source: 'streak_bonus' })
  }

  // Get current XP record
  const { data: existing } = await supabase
    .from('user_xp')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  const currentTotal = existing?.total_xp || 0
  const currentLevel = existing?.current_level || 1
  const newTotal = currentTotal + xpEarned
  const newLevel = calculateLevel(newTotal)
  const leveledUp = newLevel > currentLevel

  // Get current week start (Monday)
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  const weekStart = new Date(today.setDate(diff)).toISOString().split('T')[0]

  // Calculate weekly XP
  let xpThisWeek = xpEarned
  if (existing?.week_start_date === weekStart) {
    xpThisWeek = (existing.xp_this_week || 0) + xpEarned
  }

  // Upsert XP record
  const { error: upsertError } = await supabase
    .from('user_xp')
    .upsert({
      user_id: userId,
      total_xp: newTotal,
      current_level: newLevel,
      xp_this_week: xpThisWeek,
      week_start_date: weekStart,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })

  if (upsertError) {
    console.error('Error updating XP:', upsertError)
  }

  // Record XP history
  for (const source of xpSources) {
    await supabase.from('xp_history').insert({
      user_id: userId,
      amount: source.amount,
      source: source.source,
      reference_id: attemptId,
    })
  }

  console.log(`⭐ XP awarded: +${xpEarned} (Total: ${newTotal}, Level: ${newLevel})`)

  return { xpEarned, newTotal, newLevel, leveledUp }
}

/**
 * Badge definitions
 */
const BADGES = {
  ACCURACY_BUILDER: {
    id: 'accuracy_builder',
    name: 'Accuracy Builder',
    description: 'Improved score on the same topic twice',
  },
  CONSISTENCY: {
    id: 'consistency',
    name: 'Consistency Champion',
    description: 'Completed quizzes for 5 days',
  },
  DEPTH: {
    id: 'depth',
    name: 'Deep Diver',
    description: 'Completed 3 hard quizzes in a row',
  },
}

/**
 * Check and award badges after quiz completion
 */
export async function checkAndAwardBadges(
  userId: string,
  attemptId: string
): Promise<{ badgeEarned: string | null; badgeName: string | null }> {
  
  // Get user's existing badges
  const { data: existingBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId)

  const earnedBadgeIds = existingBadges?.map(b => b.badge_id) || []

  // Check CONSISTENCY badge (5 days of study)
  if (!earnedBadgeIds.includes(BADGES.CONSISTENCY.id)) {
    const { data: streak } = await supabase
      .from('study_streaks')
      .select('total_study_days')
      .eq('user_id', userId)
      .maybeSingle()

    if (streak && streak.total_study_days >= 5) {
      await grantBadge(userId, BADGES.CONSISTENCY)
      return { badgeEarned: BADGES.CONSISTENCY.id, badgeName: BADGES.CONSISTENCY.name }
    }
  }

  // Check DEPTH badge (3 hard quizzes in a row)
  if (!earnedBadgeIds.includes(BADGES.DEPTH.id)) {
    const { data: recentAttempts } = await supabase
      .from('sabiquiz_attempts')
      .select('difficulty, score')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(3)

    if (recentAttempts && recentAttempts.length >= 3) {
      const allHard = recentAttempts.every(a => a.difficulty === 'hard')
      const allPassed = recentAttempts.every(a => (a.score || 0) >= 60)
      
      if (allHard && allPassed) {
        await grantBadge(userId, BADGES.DEPTH)
        return { badgeEarned: BADGES.DEPTH.id, badgeName: BADGES.DEPTH.name }
      }
    }
  }

  // Check ACCURACY_BUILDER badge (improved on same topic twice)
  if (!earnedBadgeIds.includes(BADGES.ACCURACY_BUILDER.id)) {
    const { data: mastery } = await supabase
      .from('sabiquiz_mastery')
      .select('topic, total_attempts, mastery_percentage')
      .eq('user_id', userId)
      .gte('total_attempts', 6) // At least 6 attempts means multiple quizzes on same topic

    if (mastery && mastery.length > 0) {
      // If user has improved (mastery > 70% after multiple attempts)
      const improvedTopics = mastery.filter(m => m.mastery_percentage >= 70 && m.total_attempts >= 6)
      if (improvedTopics.length >= 1) {
        await grantBadge(userId, BADGES.ACCURACY_BUILDER)
        return { badgeEarned: BADGES.ACCURACY_BUILDER.id, badgeName: BADGES.ACCURACY_BUILDER.name }
      }
    }
  }

  return { badgeEarned: null, badgeName: null }
}

async function grantBadge(
  userId: string, 
  badge: { id: string; name: string; description: string }
): Promise<void> {
  const { error } = await supabase
    .from('user_badges')
    .insert({
      user_id: userId,
      badge_id: badge.id,
      badge_name: badge.name,
      badge_description: badge.description,
    })

  if (error && error.code !== '23505') { // Ignore duplicate errors
    console.error('Error granting badge:', error)
  } else {
    console.log(`🏅 Badge earned: ${badge.name}`)
  }
}

/**
 * Get user's XP and level info
 */
export async function getUserXP(userId: string): Promise<{
  totalXp: number
  currentLevel: number
  xpThisWeek: number
  xpToNextLevel: number
  progressPercent: number
}> {
  const { data } = await supabase
    .from('user_xp')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  const totalXp = data?.total_xp || 0
  const currentLevel = data?.current_level || 1
  const xpThisWeek = data?.xp_this_week || 0

  const currentLevelThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0
  const nextLevelThreshold = LEVEL_THRESHOLDS[currentLevel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  const xpToNextLevel = nextLevelThreshold - totalXp
  const levelProgress = totalXp - currentLevelThreshold
  const levelRange = nextLevelThreshold - currentLevelThreshold
  const progressPercent = Math.round((levelProgress / levelRange) * 100)

  return { totalXp, currentLevel, xpThisWeek, xpToNextLevel, progressPercent }
}

/**
 * Get user's badges
 */
export async function getUserBadges(userId: string): Promise<{
  id: string
  badge_id: string
  badge_name: string
  badge_description: string
  earned_at: string
}[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })

  if (error) {
    console.error('Error fetching badges:', error)
    return []
  }

  return data || []
}