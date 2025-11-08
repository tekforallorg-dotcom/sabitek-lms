'use client'
import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { 
  X, TrendingUp, Target, Award, Brain, Flame, Calendar, 
  Star, BookOpen, Clock, Zap, Trophy, Activity, ArrowUp,
  CheckCircle2, AlertCircle, Sparkles, BarChart3, Briefcase
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

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
}

interface Course {
  id: string
  title: string
  description: string
  thumbnail_url: string | null
  level: string | null
  users: {
    full_name: string
  } | null
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

  // Memoized computed values - ONLY SHOW 3 MOST RECENT
  const struggles = useMemo(() => 
    (memory?.insights || [])
      .filter(i => i.insight_type === 'topic_struggle')
      .slice(0, 3),
    [memory?.insights]
  )
  
  const interests = useMemo(() => 
    (memory?.insights || [])
      .filter(i => i.insight_type === 'topic_interest')
      .slice(0, 3),
    [memory?.insights]
  )
  
  const goals = useMemo(() => 
    memory?.insights.filter(i => i.insight_type === 'goal_mentioned') || [], 
    [memory?.insights]
  )
  
  const careerInsights = useMemo(() => 
    memory?.insights.filter(i => i.insight_type === 'career_context') || [], 
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
    if (current < 3) return 'Keep going! You\'re building momentum'
    if (current < 7) return 'Great start! Consistency is key'
    if (current < 14) return 'You\'re on fire! Keep it up'
    if (current < 30) return 'Impressive dedication!'
    return 'You\'re unstoppable! 🌟'
  }, [memory?.streak?.current_streak])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-red-500 via-red-600 to-pink-600 p-8 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Your Learning Journey</h2>
                  <p className="text-red-100 text-sm mt-1">Track progress • Build momentum • Achieve goals</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all group" aria-label="Close">
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <Flame className="w-5 h-5 text-orange-300" />
                  <div>
                    <p className="text-xs text-red-100 uppercase tracking-wider font-medium">Streak</p>
                    <p className="text-2xl font-bold">{memory?.streak?.current_streak || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-yellow-300" />
                  <div>
                    <p className="text-xs text-red-100 uppercase tracking-wider font-medium">Achievements</p>
                    <p className="text-2xl font-bold">{memory?.uncelebrated_milestones?.length || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-green-300" />
                  <div>
                    <p className="text-xs text-red-100 uppercase tracking-wider font-medium">Total Days</p>
                    <p className="text-2xl font-bold">{memory?.streak?.total_study_days || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'insights', label: 'Insights', icon: Brain },
              { id: 'goals', label: 'Goals', icon: Target },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 border-b-2 ${
                  activeTab === tab.id ? 'border-red-500 text-red-600' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-320px)] bg-gradient-to-b from-gray-50 to-white">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-red-200 border-t-red-500 rounded-full animate-spin"></div>
                <Sparkles className="w-6 h-6 text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-gray-600 mt-4 font-medium">Loading your journey...</p>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Study Streak Card */}
                  <div className="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 rounded-2xl p-6 border-2 border-orange-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md">
                            <Flame className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">Study Streak</h3>
                            <p className="text-sm text-gray-600">{getStreakMessage()}</p>
                          </div>
                        </div>
                        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 mb-2">
                          {memory?.streak?.current_streak || 0}
                          <span className="text-xl text-gray-600 ml-2 font-medium">days</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-600" />
                            <span>Longest: <strong>{memory?.streak?.longest_streak || 0}</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span>Total: <strong>{memory?.streak?.total_study_days || 0}</strong></span>
                          </div>
                        </div>
                      </div>
                      <div className="text-6xl animate-bounce">
                        {(memory?.streak?.current_streak || 0) >= 7 ? '🔥' : '⚡'}
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-6 pt-6 border-t border-orange-200">
                      <div className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                        <span>Next milestone</span>
                        <span className="text-orange-600">{streakProgress.next} days</span>
                      </div>
                      <div className="relative w-full bg-gradient-to-r from-orange-100 to-red-100 rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-1000 ease-out shadow-md"
                          style={{ width: `${Math.min(streakProgress.percent, 100)}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        {streakProgress.next - (memory?.streak?.current_streak || 0)} more days to your next achievement!
                      </p>
                    </div>
                  </div>

                  {/* Recent Achievements */}
                  {memory?.uncelebrated_milestones && memory.uncelebrated_milestones.length > 0 && (
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 border-2 border-yellow-200/50 shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                          <Award className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Recent Achievements</h3>
                          <p className="text-sm text-gray-600">Celebrate your progress!</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {memory.uncelebrated_milestones.map((milestone, idx) => (
                          <div 
                            key={milestone.id} 
                            className="flex items-start gap-4 bg-white p-4 rounded-xl border border-yellow-200 shadow-sm hover:shadow-md transition-all duration-200 group animate-fadeIn"
                            style={{ animationDelay: `${idx * 100}ms` }}
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow group-hover:scale-110 transition-transform duration-200">
                              <Star className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{milestone.milestone_name}</p>
                              <p className="text-sm text-gray-600 mt-1">{milestone.milestone_description}</p>
                              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(milestone.achieved_at).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Topics Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Focus Areas - ALWAYS SHOW */}
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border-2 border-red-200/50 shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-md">
                          <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Focus Areas</h3>
                          <p className="text-sm text-gray-600">
                            {struggles.length > 0 ? `${struggles.length} topics need attention` : 'No struggles mentioned yet'}
                          </p>
                        </div>
                      </div>
                      
                      {struggles.length > 0 ? (
                        <div className="space-y-2">
                          {struggles.map((struggle, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-center justify-between bg-white p-3 rounded-xl border border-red-200 hover:border-red-300 transition-all duration-200 group animate-fadeIn"
                              style={{ animationDelay: `${idx * 50}ms` }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-red-500 rounded-full group-hover:scale-150 transition-transform duration-200"></div>
                                <span className="text-gray-800 font-medium">{struggle.insight_content}</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {Math.floor((Date.now() - new Date(struggle.extracted_at).getTime()) / (1000 * 60 * 60 * 24))}d ago
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">Chat with SabiBot about topics you find challenging!</p>
                        </div>
                      )}
                    </div>

                    {/* Your Interests - ALWAYS SHOW */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200/50 shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Your Interests</h3>
                          <p className="text-sm text-gray-600">Topics you love exploring</p>
                        </div>
                      </div>
                      
                      {interests.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {interests.map((interest, idx) => (
                            <span
                              key={idx}
                              className="px-4 py-2 bg-white text-green-700 rounded-full text-sm font-medium border border-green-200 hover:border-green-300 hover:shadow-md transition-all duration-200 cursor-pointer animate-fadeIn"
                              style={{ animationDelay: `${idx * 50}ms` }}
                            >
                              {interest.insight_content}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">Chat with SabiBot about topics you're interested in!</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recommended Courses */}
                  {recommendedCourses.length > 0 && (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200/50 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">Recommended for You</h3>
                            <p className="text-sm text-gray-600">Courses matched to your learning goals</p>
                          </div>
                        </div>
                        <a 
                          href="/courses" 
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 group"
                        >
                          View All
                          <ArrowUp className="w-4 h-4 rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </a>
                      </div>
                      
                      <div className="space-y-3">
                        {recommendedCourses.slice(0, 3).map((course, idx) => (
                          <a
                            key={course.id}
                            href={`/courses/${course.id}`}
                            className="flex items-start gap-4 bg-white p-4 rounded-xl border border-indigo-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 group animate-fadeIn"
                            style={{ animationDelay: `${idx * 100}ms` }}
                          >
                            {course.thumbnail_url ? (
                              <img 
                                src={course.thumbnail_url} 
                                alt={course.title}
                                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <BookOpen className="w-8 h-8 text-indigo-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                {course.title}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {course.description}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                {course.level && (
                                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                                    {course.level}
                                  </span>
                                )}
                                {course.users?.full_name && (
                                  <span className="text-xs text-gray-500">
                                    by {course.users.full_name}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Zap className="w-5 h-5 text-indigo-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        ))}
                      </div>

                      {loadingCourses && (
                        <div className="text-center py-4">
                          <div className="inline-block w-6 h-6 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Empty State */}
                  {!memory?.streak && !memory?.context?.learning_goals?.length && struggles.length === 0 && interests.length === 0 && (
                    <div className="text-center py-20 animate-fadeIn">
                      <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Calendar className="w-12 h-12 text-red-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Start Your Learning Journey</h3>
                      <p className="text-gray-600 max-w-md mx-auto mb-6">
                        Chat with SabiBot regularly to build your streak, set goals, and unlock personalized insights!
                      </p>
                      <button 
                        onClick={onClose}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 inline-flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Start Chatting
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Insights Tab */}
              {activeTab === 'insights' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200/50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Learning Insights</h3>
                        <p className="text-sm text-gray-600">Patterns we've discovered about your learning</p>
                      </div>
                    </div>

                    {careerInsights.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-blue-600" />
                          Career Context
                        </h4>
                        <div className="space-y-2">
                          {careerInsights.map((insight, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-xl border border-blue-200">
                              <p className="text-gray-800">{insight.insight_content}</p>
                              <p className="text-xs text-gray-500 mt-2">Confidence: {insight.confidence_score}%</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {goals.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4 text-blue-600" />
                          Mentioned Goals
                        </h4>
                        <div className="space-y-2">
                          {goals.map((goal, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-xl border border-blue-200 flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-gray-800 font-medium">{goal.insight_content}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Mentioned {new Date(goal.extracted_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {careerInsights.length === 0 && goals.length === 0 && (
                      <div className="text-center py-12">
                        <Brain className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                        <p className="text-gray-600">Keep chatting with SabiBot to unlock insights about your learning journey!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Goals Tab */}
              {activeTab === 'goals' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200/50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Your Learning Goals</h3>
                        <p className="text-sm text-gray-600">Track your progress towards mastery</p>
                      </div>
                    </div>

                    {memory?.context?.learning_goals && memory.context.learning_goals.length > 0 ? (
                      <div className="space-y-3">
                        {memory.context.learning_goals.map((goal, idx) => (
                          <div key={idx} className="bg-white p-5 rounded-xl border border-purple-200 hover:border-purple-300 transition-all duration-200 shadow-sm hover:shadow-md">
                            <div className="flex items-start gap-4">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Zap className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-900 font-semibold text-lg">{goal}</p>
                                <div className="mt-3 space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Progress</span>
                                    <span className="text-purple-600 font-medium">In Progress</span>
                                  </div>
                                  <div className="w-full bg-purple-100 rounded-full h-2">
                                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Target className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">No goals set yet</p>
                        <p className="text-sm text-gray-500 max-w-md mx-auto">
                          Tell SabiBot what you want to learn, and we'll help you track your progress!
                        </p>
                      </div>
                    )}
                  </div>

                  {memory?.context?.career_goals && memory.context.career_goals.length > 0 && (
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border-2 border-indigo-200/50">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Career Goals</h3>
                          <p className="text-sm text-gray-600">Your professional aspirations</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {memory.context.career_goals.map((goal, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-xl border border-indigo-200 flex items-center gap-3">
                            <ArrowUp className="w-5 h-5 text-indigo-600" />
                            <span className="text-gray-800 font-medium">{goal}</span>
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

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-shimmer { animation: shimmer 2s infinite; }
      `}</style>
    </div>
  )
})

LearningStats.displayName = 'LearningStats'

export default LearningStats 