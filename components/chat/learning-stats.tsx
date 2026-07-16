'use client'
import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import {
  X, TrendingUp, Target, Award, Brain, Flame, Calendar,
  Star, BookOpen, Clock, Zap, Trophy, ArrowUp,
  CheckCircle2, AlertCircle, BarChart3, Briefcase, GraduationCap,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import SabiLoader from '@/components/ui/SabiLoader'

interface LearningStatsProps {
  isOpen: boolean
  onClose: () => void
}

interface UserMemory {
  context: {
    learning_goals: string[]
    career_goals: string[]
    current_occupation: string
    weak_topics: Array<{ topic: string; confidence: number }>
    strong_topics: Array<{ topic: string; confidence: number }>
  } | null
  streak: {
    current_streak: number
    longest_streak: number
    total_study_days: number
    last_study_date: string
  } | null
  uncelebrated_milestones: Array<{
    id: string
    milestone_name: string
    milestone_description: string
    achieved_at: string
    milestone_type: string
  }>
  insights: Array<{
    insight_type: string
    insight_content: string
    confidence_score: number
    extracted_at: string
  }>
  // Real platform data (lessons/quizzes/certs), not just chat streaks
  learning_stats?: {
    lessons_completed: number
    quizzes_passed: number
    certificates_earned: number
    courses_enrolled: number
    achievements: number
  }
}

interface Course {
  id: string
  slug?: string
  title: string
  description: string
  thumbnail_url: string | null
  level: string | null
  users: {
    full_name: string
  } | null
}

const glassCard =
  'relative overflow-hidden bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]'

function Hairline() {
  return (
    <span
      className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent"
      aria-hidden="true"
    />
  )
}

const LearningStats = memo(({ isOpen, onClose }: LearningStatsProps) => {
  const { user } = useAuth()
  const [memory, setMemory] = useState<UserMemory | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'goals'>('overview')
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)

  const fetchMemory = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/sabibot/memory?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setMemory(data)
      }
    } catch (error) {
      console.error('Failed to fetch learning stats:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  const fetchRecommendedCourses = useCallback(async () => {
    if (!user?.id) return
    setLoadingCourses(true)
    try {
      const response = await fetch(`/api/sabibot/recommend-courses?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setRecommendedCourses(data.recommendations || [])
      }
    } catch (error) {
      console.error('Failed to fetch course recommendations:', error)
    } finally {
      setLoadingCourses(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchMemory()
    }
  }, [isOpen, user?.id, fetchMemory])

  useEffect(() => {
    if (isOpen && user?.id && activeTab === 'overview') {
      fetchRecommendedCourses()
    }
  }, [isOpen, user?.id, activeTab, fetchRecommendedCourses])

  const struggles = useMemo(
    () => (memory?.insights || []).filter(i => i.insight_type === 'topic_struggle').slice(0, 3),
    [memory?.insights]
  )

  const interests = useMemo(
    () => (memory?.insights || []).filter(i => i.insight_type === 'topic_interest').slice(0, 3),
    [memory?.insights]
  )

  const goals = useMemo(
    () => memory?.insights.filter(i => i.insight_type === 'goal_mentioned') || [],
    [memory?.insights]
  )

  const careerInsights = useMemo(
    () => memory?.insights.filter(i => i.insight_type === 'career_context') || [],
    [memory?.insights]
  )

  const getStreakProgress = useCallback(() => {
    const current = memory?.streak?.current_streak || 0
    if (current < 3) return { next: 3, percent: (current / 3) * 100 }
    if (current < 7) return { next: 7, percent: (current / 7) * 100 }
    if (current < 14) return { next: 14, percent: (current / 14) * 100 }
    if (current < 30) return { next: 30, percent: (current / 30) * 100 }
    if (current < 60) return { next: 60, percent: (current / 60) * 100 }
    return { next: 100, percent: (current / 100) * 100 }
  }, [memory?.streak?.current_streak])

  const streakProgress = useMemo(() => getStreakProgress(), [getStreakProgress])

  const getStreakMessage = useCallback(() => {
    const current = memory?.streak?.current_streak || 0
    if (current === 0) return 'Start your journey today!'
    if (current < 3) return "Keep going! You're building momentum"
    if (current < 7) return 'Great start! Consistency is key'
    if (current < 14) return "You're on fire! Keep it up"
    if (current < 30) return 'Impressive dedication!'
    return "You're unstoppable!"
  }, [memory?.streak?.current_streak])

  if (!isOpen) return null

  const stats = memory?.learning_stats

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#fffcfb] rounded-3xl shadow-[0_40px_90px_-30px_rgba(225,29,72,0.5)] ring-1 ring-rose-100 max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
        {/* ── Header ── */}
        <div className="relative bg-gradient-to-br from-red-500 to-rose-600 p-6 sm:p-8 text-white overflow-hidden">
          <span className="absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" aria-hidden="true" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className="w-13 h-13 sm:w-14 sm:h-14 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/25 shadow-lg">
                  <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">Learning analytics</p>
                  <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
                    Your learning{' '}
                    <span className="font-serif italic">journey</span>
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-all group cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Real platform stats, not just chat streaks */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { icon: Flame, label: 'Day streak', value: memory?.streak?.current_streak || 0, tint: 'text-orange-200' },
                { icon: BookOpen, label: 'Lessons done', value: stats?.lessons_completed ?? 0, tint: 'text-rose-100' },
                { icon: CheckCircle2, label: 'Quizzes passed', value: stats?.quizzes_passed ?? 0, tint: 'text-emerald-200' },
                { icon: GraduationCap, label: 'Certificates', value: stats?.certificates_earned ?? 0, tint: 'text-yellow-200' },
              ].map((s, i) => (
                <div key={i} className="bg-white/12 backdrop-blur-md rounded-2xl px-3.5 py-3 border border-white/15">
                  <div className="flex items-center gap-1.5 mb-1">
                    <s.icon className={`w-3.5 h-3.5 ${s.tint}`} />
                    <p className="text-[10px] text-white/75 uppercase tracking-wider font-medium">{s.label}</p>
                  </div>
                  <p className="text-2xl font-bold tabular-nums leading-none">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="border-b border-rose-100 bg-rose-50/40">
          <div className="flex px-4 sm:px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'insights', label: 'Insights', icon: Brain },
              { id: 'goals', label: 'Goals', icon: Target },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3.5 text-sm font-semibold transition-all duration-200 border-b-2 cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <SabiLoader text="Loading your journey..." size="lg" />
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-5 animate-fadeIn">
                  {/* Streak card */}
                  <div className={`${glassCard} p-5 sm:p-6`}>
                    <Hairline />
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-[0_10px_20px_-8px_rgba(251,146,60,0.6)]">
                            <Flame className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold tracking-tight text-gray-900">Study Streak</h3>
                            <p className="text-xs text-gray-500">{getStreakMessage()}</p>
                          </div>
                        </div>
                        <div className="text-5xl font-bold tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 mb-2">
                          {memory?.streak?.current_streak || 0}
                          <span className="text-lg text-gray-500 ml-2 font-medium">days</span>
                        </div>
                        <div className="flex items-center gap-5 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            <span>Longest: <strong className="tabular-nums">{memory?.streak?.longest_streak || 0}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-rose-400" />
                            <span>Total: <strong className="tabular-nums">{memory?.streak?.total_study_days || 0}</strong></span>
                          </div>
                          {stats && (
                            <div className="hidden sm:flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-rose-400" />
                              <span>Achievements: <strong className="tabular-nums">{stats.achievements}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Zap className={`w-7 h-7 ${(memory?.streak?.current_streak || 0) >= 7 ? 'text-orange-500' : 'text-rose-300'}`} />
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-rose-100">
                      <div className="flex items-center justify-between text-xs font-medium text-gray-600 mb-2">
                        <span>Next milestone</span>
                        <span className="text-orange-600 font-bold">{streakProgress.next} days</span>
                      </div>
                      <div className="relative w-full bg-orange-50 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${Math.min(streakProgress.percent, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {streakProgress.next - (memory?.streak?.current_streak || 0)} more day
                        {streakProgress.next - (memory?.streak?.current_streak || 0) !== 1 ? 's' : ''} to your next achievement
                      </p>
                    </div>
                  </div>

                  {/* Fresh achievements */}
                  {memory?.uncelebrated_milestones && memory.uncelebrated_milestones.length > 0 && (
                    <div className={`${glassCard} p-5 sm:p-6`}>
                      <Hairline />
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-[0_10px_20px_-8px_rgba(245,158,11,0.6)]">
                          <Award className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold tracking-tight text-gray-900">New Achievements</h3>
                          <p className="text-xs text-gray-500">Celebrate your progress!</p>
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        {memory.uncelebrated_milestones.map((milestone, idx) => (
                          <div
                            key={milestone.id}
                            className="flex items-start gap-3.5 bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100 animate-fadeIn"
                            style={{ animationDelay: `${idx * 100}ms` }}
                          >
                            <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Star className="w-4.5 h-4.5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-gray-900">{milestone.milestone_name}</p>
                              <p className="text-xs text-gray-600 mt-0.5">{milestone.milestone_description}</p>
                              <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(milestone.achieved_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Focus / Interests */}
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className={`${glassCard} p-5`}>
                      <Hairline />
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold tracking-tight text-gray-900">Focus Areas</h3>
                          <p className="text-xs text-gray-500">
                            {struggles.length > 0 ? `${struggles.length} topics need attention` : 'No struggles mentioned yet'}
                          </p>
                        </div>
                      </div>

                      {struggles.length > 0 ? (
                        <div className="space-y-2">
                          {struggles.map((struggle, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-rose-50/60 p-3 rounded-xl border border-rose-100 animate-fadeIn"
                              style={{ animationDelay: `${idx * 50}ms` }}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                <span className="text-sm text-gray-800 font-medium">{struggle.insight_content}</span>
                              </div>
                              <span className="text-[11px] text-gray-400">
                                {Math.floor((Date.now() - new Date(struggle.extracted_at).getTime()) / (1000 * 60 * 60 * 24))}d
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-6">
                          Chat with SabiBot about topics you find challenging
                        </p>
                      )}
                    </div>

                    <div className={`${glassCard} p-5`}>
                      <Hairline />
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center">
                          <Zap className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold tracking-tight text-gray-900">Your Interests</h3>
                          <p className="text-xs text-gray-500">Topics you love exploring</p>
                        </div>
                      </div>

                      {interests.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {interests.map((interest, idx) => (
                            <span
                              key={idx}
                              className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-100 animate-fadeIn"
                              style={{ animationDelay: `${idx * 50}ms` }}
                            >
                              {interest.insight_content}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-6">
                          Chat with SabiBot about topics you enjoy
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Recommended courses */}
                  {recommendedCourses.length > 0 && (
                    <div className={`${glassCard} p-5 sm:p-6`}>
                      <Hairline />
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-[0_10px_20px_-8px_rgba(225,29,72,0.5)]">
                            <BookOpen className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold tracking-tight text-gray-900">Recommended for You</h3>
                            <p className="text-xs text-gray-500">Matched to your learning goals</p>
                          </div>
                        </div>
                        <a
                          href="/courses"
                          className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 group"
                        >
                          View All
                          <ArrowUp className="w-3.5 h-3.5 rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </a>
                      </div>

                      <div className="space-y-2.5">
                        {recommendedCourses.slice(0, 3).map((course, idx) => (
                          <a
                            key={course.id}
                            href={`/courses/${course.slug || course.id}`}
                            className="flex items-start gap-3.5 bg-rose-50/50 p-3.5 rounded-2xl border border-rose-100 hover:border-rose-200 hover:bg-rose-50 transition-all duration-200 group animate-fadeIn"
                            style={{ animationDelay: `${idx * 100}ms` }}
                          >
                            {course.thumbnail_url ? (
                              <img
                                src={course.thumbnail_url}
                                alt={course.title}
                                className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-white border border-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <BookOpen className="w-6 h-6 text-rose-300" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-gray-900 group-hover:text-red-600 transition-colors line-clamp-1">
                                {course.title}
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{course.description}</p>
                              <div className="flex items-center gap-2.5 mt-1.5">
                                {course.level && (
                                  <span className="px-2 py-0.5 bg-white border border-rose-100 text-red-600 rounded-full text-[10px] font-semibold">
                                    {course.level}
                                  </span>
                                )}
                                {course.users?.full_name && (
                                  <span className="text-[11px] text-gray-400">by {course.users.full_name}</span>
                                )}
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>

                      {loadingCourses && (
                        <div className="flex justify-center py-3">
                          <SabiLoader text="" size="sm" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Empty state */}
                  {!memory?.streak && !memory?.context?.learning_goals?.length && struggles.length === 0 && interests.length === 0 && (
                    <div className="text-center py-16 animate-fadeIn">
                      <div className="w-20 h-20 bg-rose-50 border border-rose-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
                        <Calendar className="w-10 h-10 text-rose-300" />
                      </div>
                      <h3 className="text-xl font-semibold tracking-tight text-gray-900 mb-2">
                        Start your learning{' '}
                        <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">journey</span>
                      </h3>
                      <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">
                        Chat with SabiBot regularly to build your streak, set goals, and unlock personalized insights.
                      </p>
                      <button
                        onClick={onClose}
                        className="relative overflow-hidden px-6 py-2.5 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white rounded-full text-sm font-semibold shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5 inline-flex items-center gap-2 cursor-pointer"
                      >
                        <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                        Start Chatting
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'insights' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className={`${glassCard} p-5 sm:p-6`}>
                    <Hairline />
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-[0_10px_20px_-8px_rgba(225,29,72,0.5)]">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold tracking-tight text-gray-900 text-lg">Learning Insights</h3>
                        <p className="text-xs text-gray-500">Patterns discovered from your conversations</p>
                      </div>
                    </div>

                    {careerInsights.length > 0 && (
                      <div className="mb-5">
                        <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2.5 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-rose-400" />
                          Career Context
                        </h4>
                        <div className="space-y-2">
                          {careerInsights.map((insight, idx) => (
                            <div key={idx} className="bg-rose-50/60 p-3.5 rounded-2xl border border-rose-100">
                              <p className="text-sm text-gray-800">{insight.insight_content}</p>
                              <p className="text-[11px] text-gray-400 mt-1.5">Confidence: {insight.confidence_score}%</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {goals.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2.5 flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-rose-400" />
                          Mentioned Goals
                        </h4>
                        <div className="space-y-2">
                          {goals.map((goal, idx) => (
                            <div key={idx} className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100 flex items-start gap-3">
                              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm text-gray-800 font-medium">{goal.insight_content}</p>
                                <p className="text-[11px] text-gray-400 mt-1">
                                  Mentioned {new Date(goal.extracted_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {careerInsights.length === 0 && goals.length === 0 && (
                      <div className="text-center py-10">
                        <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Brain className="w-7 h-7 text-rose-200" />
                        </div>
                        <p className="text-sm text-gray-500">Keep chatting with SabiBot to unlock insights about your learning journey.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'goals' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className={`${glassCard} p-5 sm:p-6`}>
                    <Hairline />
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-[0_10px_20px_-8px_rgba(225,29,72,0.5)]">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold tracking-tight text-gray-900 text-lg">Your Learning Goals</h3>
                        <p className="text-xs text-gray-500">Track your progress towards mastery</p>
                      </div>
                    </div>

                    {memory?.context?.learning_goals && memory.context.learning_goals.length > 0 ? (
                      <div className="space-y-2.5">
                        {memory.context.learning_goals.map((goal, idx) => (
                          <div key={idx} className="bg-rose-50/60 p-4 rounded-2xl border border-rose-100">
                            <div className="flex items-start gap-3.5">
                              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Zap className="w-4 h-4 text-white" />
                              </div>
                              <p className="text-sm text-gray-900 font-semibold pt-1.5">{goal}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Target className="w-7 h-7 text-rose-200" />
                        </div>
                        <p className="text-sm font-medium text-gray-600 mb-1.5">No goals set yet</p>
                        <p className="text-xs text-gray-400 max-w-md mx-auto">
                          Tell SabiBot what you want to learn, and it will help you track your progress.
                        </p>
                      </div>
                    )}
                  </div>

                  {memory?.context?.career_goals && memory.context.career_goals.length > 0 && (
                    <div className={`${glassCard} p-5 sm:p-6`}>
                      <Hairline />
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold tracking-tight text-gray-900">Career Goals</h3>
                          <p className="text-xs text-gray-500">Your professional aspirations</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {memory.context.career_goals.map((goal, idx) => (
                          <div key={idx} className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100 flex items-center gap-3">
                            <ArrowUp className="w-4.5 h-4.5 text-emerald-500" />
                            <span className="text-sm text-gray-800 font-medium">{goal}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  )
})

LearningStats.displayName = 'LearningStats'

export default LearningStats
