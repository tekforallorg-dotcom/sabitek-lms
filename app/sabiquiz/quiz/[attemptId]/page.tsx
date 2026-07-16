'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Clock, Bookmark, Loader2, CheckCircle, Save, Flame, Zap, Trophy, Skull, X, HelpCircle, Sparkles, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { updateStreakAndMastery, awardXP, checkAndAwardBadges } from '@/lib/sabiquiz/quiz-utils'
import type { Question } from '@/lib/sabiquiz/types'
import { toast } from '@/components/ui/toast'
import SabiLoader from '@/components/ui/SabiLoader'

// ============================================================================
// PROGRESS BAR CHARACTERS & ANIMATIONS (PRESERVED)
// ============================================================================

type AnimationType = 'bounce' | 'pulse' | 'wiggle' | 'spin' | 'swing' | 'hop' | 'zoom' | 'shake'

type CharacterType = {
  id: string
  emoji: string
  finishEmoji: string
  label: string
  animation: AnimationType
}

const CHARACTERS: CharacterType[] = [
  { id: 'bike', emoji: '🚴', finishEmoji: '🏁', label: 'Cyclist', animation: 'bounce' },
  { id: 'horse', emoji: '🏇', finishEmoji: '🏁', label: 'Horse Racer', animation: 'hop' },
  { id: 'car', emoji: '🏎️', finishEmoji: '🏁', label: 'Race Car', animation: 'shake' },
  { id: 'rabbit', emoji: '🐇', finishEmoji: '🥕', label: 'Rabbit', animation: 'hop' },
  { id: 'runner', emoji: '🏃', finishEmoji: '🏁', label: 'Runner', animation: 'bounce' },
  { id: 'woman', emoji: '💃', finishEmoji: '🌟', label: 'Dancer', animation: 'swing' },
  { id: 'baby', emoji: '👶', finishEmoji: '🍼', label: 'Baby', animation: 'wiggle' },
  { id: 'bowling', emoji: '🎳', finishEmoji: '🎯', label: 'Bowling', animation: 'spin' },
  { id: 'comet', emoji: '☄️', finishEmoji: '💥', label: 'Comet', animation: 'zoom' },
  { id: 'arrow', emoji: '🏹', finishEmoji: '🎯', label: 'Arrow', animation: 'pulse' },
  { id: 'rocket', emoji: '🚀', finishEmoji: '🌙', label: 'Rocket', animation: 'shake' },
  { id: 'plane', emoji: '✈️', finishEmoji: '🏝️', label: 'Plane', animation: 'swing' },
  { id: 'swimmer', emoji: '🏊', finishEmoji: '🏆', label: 'Swimmer', animation: 'wiggle' },
  { id: 'skier', emoji: '⛷️', finishEmoji: '🏔️', label: 'Skier', animation: 'swing' },
  { id: 'dog', emoji: '🐕', finishEmoji: '🦴', label: 'Dog', animation: 'hop' },
  { id: 'turtle', emoji: '🐢', finishEmoji: '🥬', label: 'Turtle', animation: 'pulse' },
  { id: 'snail', emoji: '🐌', finishEmoji: '🍃', label: 'Snail', animation: 'pulse' },
  { id: 'bee', emoji: '🐝', finishEmoji: '🌸', label: 'Bee', animation: 'swing' },
  { id: 'bird', emoji: '🐦', finishEmoji: '🪺', label: 'Bird', animation: 'swing' },
  { id: 'ghost', emoji: '👻', finishEmoji: '🏚️', label: 'Ghost', animation: 'wiggle' },
  { id: 'ufo', emoji: '🛸', finishEmoji: '👽', label: 'UFO', animation: 'swing' },
  { id: 'santa', emoji: '🎅', finishEmoji: '🎄', label: 'Santa', animation: 'bounce' },
  { id: 'ninja', emoji: '🥷', finishEmoji: '🗡️', label: 'Ninja', animation: 'hop' },
  { id: 'superhero', emoji: '🦸', finishEmoji: '💥', label: 'Superhero', animation: 'zoom' },
]

const DEFAULT_CHARACTER = CHARACTERS[0]

const getAnimationStyle = (animation: AnimationType, isComplete: boolean): React.CSSProperties => {
  if (isComplete) {
    return { animation: 'celebrate 0.5s ease-in-out infinite' }
  }

  const animations: Record<AnimationType, string> = {
    bounce: 'bounce 0.6s ease-in-out infinite',
    pulse: 'pulse 1s ease-in-out infinite',
    wiggle: 'wiggle 0.5s ease-in-out infinite',
    spin: 'spin 1s linear infinite',
    swing: 'swing 1s ease-in-out infinite',
    hop: 'hop 0.4s ease-in-out infinite',
    zoom: 'zoom 0.8s ease-in-out infinite',
    shake: 'shake 0.3s ease-in-out infinite',
  }

  return { animation: animations[animation] || animations.bounce }
}

function AnimationStyles() {
  return (
    <style jsx global>{`
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.15); opacity: 0.85; }
      }
      
      @keyframes wiggle {
        0%, 100% { transform: rotate(-3deg); }
        50% { transform: rotate(3deg); }
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes swing {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-3px) rotate(2deg); }
        75% { transform: translateY(-3px) rotate(-2deg); }
      }
      
      @keyframes hop {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
      
      @keyframes zoom {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-1px); }
        75% { transform: translateX(1px); }
      }
      
      @keyframes celebrate {
        0%, 100% { transform: scale(1) rotate(0deg); }
        25% { transform: scale(1.2) rotate(-5deg); }
        50% { transform: scale(1.3) rotate(0deg); }
        75% { transform: scale(1.2) rotate(5deg); }
      }
      
      @keyframes finishGlow {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
      }

      @keyframes burn {
        0%, 100% { transform: scaleY(1); opacity: 1; }
        50% { transform: scaleY(1.2); opacity: 0.8; }
      }

      @keyframes fuseBurn {
        0% { background-position: 100% 0; }
        100% { background-position: 0% 0; }
      }

      @keyframes explode {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(2); opacity: 1; }
        100% { transform: scale(3); opacity: 0; }
      }

      @keyframes alarmShake {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(-10deg); }
        75% { transform: rotate(10deg); }
      }

      @keyframes streakPulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
        50% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
      }

      @keyframes failShake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
        20%, 40%, 60%, 80% { transform: translateX(4px); }
      }

      @keyframes bossFlame {
        0%, 100% { transform: scaleY(1) scaleX(1); }
        25% { transform: scaleY(1.1) scaleX(0.95); }
        50% { transform: scaleY(0.95) scaleX(1.05); }
        75% { transform: scaleY(1.05) scaleX(0.98); }
      }

      @keyframes skullFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }

     @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      @keyframes aggressiveShake {
        0%, 100% { transform: translateX(0) rotate(0deg); }
        10% { transform: translateX(-3px) rotate(-3deg); }
        20% { transform: translateX(3px) rotate(3deg); }
        30% { transform: translateX(-3px) rotate(-2deg); }
        40% { transform: translateX(3px) rotate(2deg); }
        50% { transform: translateX(-2px) rotate(-1deg); }
        60% { transform: translateX(2px) rotate(1deg); }
        70% { transform: translateX(-2px) rotate(-1deg); }
        80% { transform: translateX(2px) rotate(1deg); }
        90% { transform: translateX(-1px) rotate(0deg); }
      }
    `}</style> 
  )
}

// Progress Bar Component - RIGHT to LEFT direction (PRESERVED)
function ProgressBarWithCharacter({ 
  progress, 
  character 
}: { 
  progress: number
  character: CharacterType 
}) {
  const isComplete = progress >= 100
  const animationStyle = getAnimationStyle(character.animation, isComplete)
  
  return (
    <div className="relative h-8 flex items-center gap-1">
      <span 
        className="text-xl flex-shrink-0"
        style={{
          opacity: isComplete ? 1 : 0.7,
          animation: isComplete ? 'celebrate 0.5s ease-in-out infinite' : 'finishGlow 2s ease-in-out infinite',
          display: 'inline-block',
        }}
      >
        {character.finishEmoji}
      </span>
      
      <div className="flex-1 relative">
        <div className="h-2.5 bg-white/20 rounded-full">
          <div
            className="h-2.5 bg-gradient-to-l from-red-400 to-red-600 rounded-full transition-all duration-500 ease-out float-right"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        
        <div 
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-out z-20"
          style={{ 
            right: `${Math.min(progress, 100)}%`,
            transform: 'translateY(-50%) translateX(50%)',
          }}
        >
          {!isComplete && progress > 5 && (
            <>
              <span className="absolute text-xs opacity-15" style={{ left: '20px' }}>
                {character.emoji}
              </span>
              <span className="absolute text-sm opacity-30" style={{ left: '12px' }}>
                {character.emoji}
              </span>
            </>
          )}
          
          <span className="text-xl inline-block" style={animationStyle}>
            {character.emoji}
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// TIME ATTACK FUSE COMPONENT
// ============================================================================

function TimeAttackFuse({ 
  progress, 
  timeRemaining,
  isExploding 
}: { 
  progress: number
  timeRemaining: number
  isExploding: boolean
}) {
  const isUrgent = timeRemaining < 30
  const isCritical = timeRemaining < 10
  
  return (
    <div className="relative h-8 flex items-center gap-2">
      {/* Flame at the burning end */}
      <div 
        className="text-xl flex-shrink-0 relative"
        style={{ 
          animation: 'burn 0.3s ease-in-out infinite',
          filter: isUrgent ? 'brightness(1.2)' : 'none'
        }}
      >
        🔥
        {isCritical && (
          <span className="absolute -top-1 -right-1 text-xs" style={{ animation: 'burn 0.2s ease-in-out infinite' }}>
            ✨
          </span>
        )}
      </div>
      
      {/* Fuse track */}
      <div className="flex-1 relative h-3">
        <div className="absolute inset-0 bg-white/20 rounded-full overflow-hidden">
          {/* Burning fuse effect */}
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ 
              width: `${100 - progress}%`,
              background: 'linear-gradient(90deg, #f97316 0%, #fbbf24 30%, #6b7280 30%, #6b7280 100%)',
              backgroundSize: '200% 100%',
              animationDuration: '2s',
              float: 'right'
            }}
          />
          {/* Burned part (dark) */}
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-gray-700 to-gray-600 rounded-l-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Spark at burn point */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-400 shadow-lg shadow-orange-500/50"
          style={{ 
            left: `${progress}%`,
            transform: 'translateY(-50%) translateX(-50%)',
            animation: 'pulse 0.3s ease-in-out infinite'
          }}
        />
      </div>
      
      {/* Dynamite */}
      <div 
        className={`text-2xl flex-shrink-0 relative ${isExploding ? 'animate-ping' : ''}`}
        style={{ 
          animation: isExploding ? 'explode 0.5s ease-out forwards' : (isCritical ? 'shake 0.1s ease-in-out infinite' : 'none')
        }}
      >
        🧨
        {isExploding && (
          <>
            <span className="absolute -top-2 -left-2 text-2xl" style={{ animation: 'explode 0.3s ease-out forwards' }}>💥</span>
            <span className="absolute -top-1 -right-2 text-xl" style={{ animation: 'explode 0.4s ease-out forwards', animationDelay: '0.1s' }}>💫</span>
            <span className="absolute -bottom-1 -left-1 text-lg" style={{ animation: 'explode 0.35s ease-out forwards', animationDelay: '0.05s' }}>🔥</span>
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// ENHANCED PERFECT RUN PROGRESS COMPONENT
// ============================================================================

function PerfectRunStreak({ 
  streak, 
  total,
  failed 
}: { 
  streak: number
  total: number
  failed: boolean
}) {
  const progress = (streak / total) * 100
  
  // Rank system based on progress
  const getRank = () => {
    if (streak === total) return { icon: '👑', title: 'Perfect', color: 'text-yellow-500' }
    if (progress >= 90) return { icon: '💎', title: 'Diamond', color: 'text-cyan-400' }
    if (progress >= 80) return { icon: '🏆', title: 'Champion', color: 'text-yellow-500' }
    if (progress >= 70) return { icon: '⭐', title: 'Star', color: 'text-yellow-400' }
    if (progress >= 60) return { icon: '🔥', title: 'On Fire', color: 'text-orange-500' }
    if (progress >= 50) return { icon: '💪', title: 'Strong', color: 'text-blue-500' }
    if (progress >= 40) return { icon: '✨', title: 'Rising', color: 'text-purple-400' }
    if (progress >= 30) return { icon: '🌟', title: 'Shining', color: 'text-yellow-300' }
    if (progress >= 20) return { icon: '🎯', title: 'Focused', color: 'text-green-500' }
    if (progress >= 10) return { icon: '🚀', title: 'Started', color: 'text-blue-400' }
    return { icon: '🎬', title: 'Begin', color: 'text-gray-400' }
  }
  
  const rank = getRank()
  
  // Generate candles based on total questions
  const renderCandles = () => {
    const maxVisible = Math.min(total, 15) // Show max 15 candles for UI
    const step = total > 15 ? Math.ceil(total / 15) : 1
    const candleCount = Math.min(total, maxVisible)
    
    return (
      <div className="flex items-end justify-center gap-1">
        {Array.from({ length: candleCount }).map((_, index) => {
          const questionIndex = index * step
          const isLit = questionIndex < streak
          const isNext = questionIndex === streak && !failed
          const isFailed = failed && questionIndex === streak
          
          return (
            <div key={index} className="flex flex-col items-center">
              {/* Flame */}
              <div className="h-5 flex items-end justify-center">
                {isLit && (
                  <span 
                    className="text-sm"
                    style={{ 
                      animation: 'burn 0.3s ease-in-out infinite',
                      animationDelay: `${index * 0.05}s`
                    }}
                  >
                    🔥
                  </span>
                )}
                {isNext && (
                  <span 
                    className="text-sm opacity-50"
                    style={{ animation: 'pulse 1s ease-in-out infinite' }}
                  >
                    ✨
                  </span>
                )}
                {isFailed && (
                  <span className="text-sm">💨</span>
                )}
              </div>
              {/* Candle */}
              <div 
                className={`w-2 rounded-t transition-all duration-300 ${
                  isLit 
                    ? 'bg-gradient-to-b from-yellow-200 to-yellow-400 h-6' 
                    : isFailed
                      ? 'bg-gradient-to-b from-gray-400 to-gray-500 h-5'
                      : 'bg-gradient-to-b from-gray-200 to-gray-300 h-5'
                }`}
              />
              {/* Base */}
              <div className={`w-3 h-1 rounded-b ${isLit ? 'bg-yellow-600' : 'bg-gray-400'}`} />
            </div>
          )
        })}
      </div>
    )
  }

  // Milestone badges
  const getMilestones = () => {
    const milestones = []
    if (streak >= 1) milestones.push('🎯')
    if (streak >= 3) milestones.push('⚡')
    if (streak >= 5) milestones.push('🌟')
    if (streak >= 7) milestones.push('💫')
    if (streak >= 10) milestones.push('🔥')
    if (streak >= 15) milestones.push('💎')
    if (streak >= 20) milestones.push('👑')
    return milestones.slice(-4) // Show last 4 milestones
  }

  if (failed) {
    return (
      <div 
        className="bg-gradient-to-r from-red-100 to-red-50 border-2 border-red-300 rounded-2xl p-4"
        style={{ animation: 'failShake 0.5s ease-in-out' }}
      >
        <div className="flex items-center justify-between">
          {/* Left: Failed indicator */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">💔</span>
            <div>
              <p className="text-xs text-red-600 font-medium">Run Ended</p>
              <p className="text-xl font-bold text-red-700">{streak}/{total}</p>
            </div>
          </div>
          
          {/* Center: Candles */}
          <div className="flex-1 mx-4">
            {renderCandles()}
          </div>
          
          {/* Right: Final rank achieved */}
          <div className="flex items-center gap-2 px-3 py-1 bg-white/50 rounded-lg">
            <span className="text-2xl">{rank.icon}</span>
            <span className={`text-sm font-medium ${rank.color}`}>{rank.title}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="bg-gradient-to-r from-green-50 via-yellow-50 to-green-50 border-2 border-green-300 rounded-2xl p-4 transition-all duration-500"
      style={{ 
        animation: streak > 0 ? 'streakPulse 2s ease-in-out infinite' : 'none',
        boxShadow: streak >= 5 ? '0 0 20px rgba(34, 197, 94, 0.3)' : 'none'
      }}
    >
      <div className="flex items-center justify-between">
        {/* Left: Streak counter with rank */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <span 
              className="text-3xl"
              style={{ animation: streak > 0 ? 'bounce 0.6s ease-in-out infinite' : 'none' }}
            >
              {rank.icon}
            </span>
            {streak >= 5 && (
              <span 
                className="absolute -top-1 -right-1 text-xs"
                style={{ animation: 'spin 2s linear infinite' }}
              >
                ✨
              </span>
            )}
          </div>
          <div>
            <p className={`text-xs font-semibold ${rank.color}`}>{rank.title}</p>
            <p className="text-2xl font-bold text-green-700">{streak}/{total}</p>
          </div>
        </div>

        {/* Center: Candles visualization */}
        <div className="flex-1 mx-4">
          {renderCandles()}
        </div>

        {/* Right: Milestones earned */}
        <div className="flex items-center gap-1">
          {getMilestones().map((milestone, i) => (
            <span 
              key={i} 
              className="text-lg"
              style={{ 
                animation: 'bounce 0.5s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`
              }}
            >
              {milestone}
            </span>
          ))}
          {streak > 0 && (
            <div className="ml-2 px-2 py-1 bg-green-100 rounded-full">
              <span className="text-xs font-bold text-green-700">
                {Math.round(progress)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar underneath */}
      <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            progress >= 80 ? 'bg-gradient-to-r from-green-500 via-yellow-500 to-green-500' :
            progress >= 50 ? 'bg-gradient-to-r from-green-500 to-lime-500' :
            'bg-green-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Encouragement message */}
      {streak > 0 && (
        <div className="mt-2 text-center">
          <p className="text-xs text-green-600 font-medium">
            {streak === total ? '🎉 PERFECT RUN!' :
             streak >= total * 0.9 ? '🔥 Almost there! One more push!' :
             streak >= total * 0.7 ? '⭐ Incredible! Keep it up!' :
             streak >= total * 0.5 ? '💪 Halfway champion!' :
             streak >= total * 0.3 ? '✨ Great momentum!' :
             streak >= 3 ? '🚀 Nice streak going!' :
             '🎯 Good start!'}
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// BOSS QUIZ INDICATOR
// ============================================================================

function BossQuizIndicator({ 
  questionsAnswered, 
  total 
}: { 
  questionsAnswered: number
  total: number
}) {
  const progress = (questionsAnswered / total) * 100
  const isNearEnd = progress > 75
  
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-red-900 to-red-700 border-2 border-red-500 shadow-lg shadow-red-500/30">
      <span 
        className="text-2xl"
        style={{ animation: 'skullFloat 1s ease-in-out infinite' }}
      >
        💀
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-red-200 font-medium">Boss Battle</span>
          {isNearEnd && <span className="text-xs">🔥</span>}
        </div>
        <div className="h-2 bg-red-950 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-white">{questionsAnswered}/{total}</p>
      </div>
      <span 
        className="text-xl"
        style={{ animation: 'bossFlame 0.5s ease-in-out infinite' }}
      >
        🔥
      </span>
    </div>
  )
}

// ============================================================================
// TIME ATTACK FLOATING TIMER
// ============================================================================

function FloatingTimer({ 
  timeRemaining, 
  isAlarm 
}: { 
  timeRemaining: number
  isAlarm: boolean
}) {
  const mins = Math.floor(timeRemaining / 60)
  const secs = timeRemaining % 60
  const isCritical = timeRemaining < 30
  const isUrgent = timeRemaining < 10
  
  // Visual buzzer states
  const [showMinuteBuzzer, setShowMinuteBuzzer] = useState(false)
  const [showThirtyBuzzer, setShowThirtyBuzzer] = useState(false)

  // Trigger visual buzzers at specific times
  useEffect(() => {
    // Every minute mark (60, 120, 180, etc.)
    if (timeRemaining > 0 && timeRemaining % 60 === 0) {
      setShowMinuteBuzzer(true)
      setTimeout(() => setShowMinuteBuzzer(false), 2000)
    }
    
    // Every 30 second mark (30, 90, 150, etc.) but not on minute marks
    if (timeRemaining > 0 && timeRemaining % 30 === 0 && timeRemaining % 60 !== 0) {
      setShowThirtyBuzzer(true)
      setTimeout(() => setShowThirtyBuzzer(false), 3000)
    }
  }, [timeRemaining])

  return (
    <div className="flex items-center gap-3">
      {/* Minute Buzzer - Pulsing dot */}
      {showMinuteBuzzer && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-xl border border-blue-300">
          <span 
            className="w-2.5 h-2.5 bg-blue-500 rounded-full"
            style={{ animation: 'pulse 0.5s ease-in-out infinite' }}
          />
          <span className="text-xs font-semibold">{mins}m left</span>
        </div>
      )}

      {/* 30 Second Buzzer - Aggressive alarm */}
      {showThirtyBuzzer && (
        <div 
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-xl border-2 border-red-400"
          style={{ animation: 'aggressiveShake 0.1s ease-in-out infinite' }}
        >
          <span className="text-lg" style={{ animation: 'aggressiveShake 0.08s ease-in-out infinite' }}>
            🚨
          </span>
          <span className="text-xs font-bold">⚠️Go faster ‼️</span>
        </div>
      )}

      {/* Main Timer */}
      <div 
        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
          isUrgent 
            ? 'bg-red-600 text-white' 
            : isCritical 
              ? 'bg-orange-500 text-white'
              : 'bg-white/10 text-white border border-white/20'
        }`}
        style={{ 
          animation: showThirtyBuzzer 
            ? 'aggressiveShake 0.1s ease-in-out infinite' 
            : isAlarm 
              ? 'alarmShake 0.1s ease-in-out infinite' 
              : 'none',
        }}
      >
        <span 
          className="text-lg"
          style={{ 
            animation: showThirtyBuzzer 
              ? 'aggressiveShake 0.08s ease-in-out infinite' 
              : isAlarm 
                ? 'alarmShake 0.15s ease-in-out infinite' 
                : 'none' 
          }}
        >
          {isUrgent ? '🚨' : showThirtyBuzzer ? '⏰' : '⏱️'}
        </span>
        <span className="font-mono text-xl font-bold">
          {mins}:{secs.toString().padStart(2, '0')}
        </span>
        {isUrgent && (
          <span className="text-lg" style={{ animation: 'pulse 0.5s ease-in-out infinite' }}>
            ⚡
          </span>
        )}
      </div>
    </div>
  )
}
// ============================================================================
// EXPLOSION OVERLAY
// ============================================================================

function ExplosionOverlay({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90">
      <div className="text-center">
        <div className="relative inline-block">
          <span className="text-6xl" style={{ animation: 'alarmShake 0.2s ease-in-out infinite' }}>⏰</span>
        </div>
        <p className="text-white text-4xl font-bold mt-6 flex items-center justify-center gap-1">
          Time's Up<span className="text-red-500">!</span>
        </p>
        <button
          onClick={onComplete}
          className="mt-8 px-8 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-red-500/20"
        >
          View Result
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// PERFECT RUN END OVERLAY
// ============================================================================

function PerfectRunEndOverlay({ 
  success, 
  streak, 
  total,
  onComplete 
}: { 
  success: boolean
  streak: number
  total: number
  onComplete: () => void 
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90">
      <div className="text-center">
        {success ? (
          <>
            <div className="relative inline-block">
              <span className="text-7xl" style={{ animation: 'celebrate 0.5s ease-in-out infinite' }}>🏆</span>
            </div>
            <p className="text-white text-3xl font-bold mt-4">PERFECT!</p>
            <p className="text-green-400 text-xl mt-2">{streak}/{total} Correct</p>
          </>
        ) : (
          <>
            <div className="relative inline-block" style={{ animation: 'failShake 0.5s ease-in-out' }}>
              <span className="text-7xl">💔</span>
            </div>
            <p className="text-white text-3xl font-bold mt-4">Run Ended</p>
            <p className="text-red-400 text-xl mt-2">{streak}/{total} Correct</p>
          </>
        )}
        <button
          onClick={onComplete}
          className="mt-8 px-8 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-red-500/20"
        >
          View Result
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// QUIZ STATE & COMPONENT
// ============================================================================

interface QuizState {
  attemptId: string
  questions: Question[]
  answers: Map<string, number>
  bookmarks: Set<string>
  timePerQuestion: Map<string, number>
  startTime: number
  currentQuestionStartTime: number
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const attemptId = params.attemptId as string

  const [state, setState] = useState<QuizState>({
    attemptId,
    questions: [],
    answers: new Map(),
    bookmarks: new Set(),
    timePerQuestion: new Map(),
    startTime: Date.now(),
    currentQuestionStartTime: Date.now(),
  })

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  
  // Challenge mode states
  const [quizMode, setQuizMode] = useState<string>('normal')
  const [timeLimit, setTimeLimit] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [perfectRunStreak, setPerfectRunStreak] = useState(0)
  const [perfectRunFailed, setPerfectRunFailed] = useState(false)
  const [showAlarm, setShowAlarm] = useState(false)
  const [showExplosion, setShowExplosion] = useState(false)
  const [showPerfectRunEnd, setShowPerfectRunEnd] = useState(false)
  const [alarmInterval, setAlarmInterval] = useState<NodeJS.Timeout | null>(null)
  
  const [character, setCharacter] = useState<CharacterType>(DEFAULT_CHARACTER)

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * CHARACTERS.length)
    setCharacter(CHARACTERS[randomIndex])
  }, [])

  useEffect(() => {
    fetchQuestions()
  }, [])

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - state.startTime) / 1000))
      
      if (timeLimit && timeRemaining !== null && timeRemaining > 0) {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) return 0
          return prev - 1
        })
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [state.startTime, timeLimit, timeRemaining])

  // Alarm effect for time attack (every 10 seconds in last minute)
  useEffect(() => {
    if (quizMode === 'time_attack' && timeRemaining !== null) {
      if (timeRemaining <= 60 && timeRemaining > 0 && timeRemaining % 10 === 0) {
        setShowAlarm(true)
        setTimeout(() => setShowAlarm(false), 1000)
      }
      
      // Critical alarm every 2 seconds in last 10 seconds
      if (timeRemaining <= 10 && timeRemaining > 0 && timeRemaining % 2 === 0) {
        setShowAlarm(true)
        setTimeout(() => setShowAlarm(false), 500)
      }
    }
  }, [timeRemaining, quizMode])

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && quizMode === 'time_attack' && !submitting && !showExplosion) {
      setShowExplosion(true)
    }
  }, [timeRemaining, quizMode, submitting, showExplosion])

  async function fetchQuestions() {
    try {
      setLoading(true)
      
      const { data: attemptData, error: attemptError } = await supabase
        .from('sabiquiz_attempts')
        .select('question_ids, status, mode, time_limit_seconds, difficulty')
        .eq('id', attemptId)
        .single()

      if (attemptError) throw attemptError
      
      // Set quiz mode and time limit
      setQuizMode(attemptData.mode || 'normal')
      if (attemptData.time_limit_seconds) {
        setTimeLimit(attemptData.time_limit_seconds)
        setTimeRemaining(attemptData.time_limit_seconds)
      }
      
      const questionIds = attemptData.question_ids
      if (!questionIds || questionIds.length === 0) {
        throw new Error('No questions found for this quiz')
      }
      
      const { data, error: fetchError } = await supabase
        .from('sabiquiz_questions')
        .select('*')
        .in('id', questionIds)

      if (fetchError) throw fetchError

      const orderedQuestions = questionIds.map((id: string) => 
        data.find(q => q.id === id)
      ).filter(Boolean)

      setState(prev => ({
        ...prev,
        questions: orderedQuestions,
      }))

      if (attemptData.status === 'in_progress') {
        await loadDraftAnswers()
      }

      await supabase
        .from('sabiquiz_attempts')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString() 
        })
        .eq('id', attemptId)

    } catch (err: any) {
      console.error('Error fetching questions:', err)
      setError('Failed to load quiz questions')
    } finally {
      setLoading(false)
    }
  }

  async function loadDraftAnswers() {
    try {
      const { data, error } = await supabase
        .from('sabiquiz_draft_responses')
        .select('*')
        .eq('attempt_id', attemptId)

      if (error) throw error

      if (data && data.length > 0) {
        const answers = new Map<string, number>()
        const bookmarks = new Set<string>()
        let correctCount = 0

        data.forEach(draft => {
          if (draft.selected_answer !== null) {
            answers.set(draft.question_id, draft.selected_answer)
          }
          if (draft.bookmarked) {
            bookmarks.add(draft.question_id)
          }
        })

        // Calculate perfect run streak from loaded answers
        if (quizMode === 'perfect_run') {
          state.questions.forEach(q => {
            const answer = answers.get(q.id)
            if (answer !== undefined && answer === q.correct_answer) {
              correctCount++
            }
          })
          setPerfectRunStreak(correctCount)
        }

        setState(prev => ({
          ...prev,
          answers,
          bookmarks,
        }))
      }
    } catch (err) {
      console.error('Error loading draft answers:', err)
    }
  }

  function handleAnswerSelect(questionId: string, answerIndex: number) {
    const question = state.questions.find(q => q.id === questionId)
    
    // Perfect Run mode - check answer immediately
    if (quizMode === 'perfect_run' && !perfectRunFailed && question) {
      if (answerIndex === question.correct_answer) {
        setPerfectRunStreak(prev => prev + 1)
      } else {
        setPerfectRunFailed(true)
        setShowPerfectRunEnd(true)
      }
    }

    setState(prev => {
      const newAnswers = new Map(prev.answers)
      newAnswers.set(questionId, answerIndex)
      return { ...prev, answers: newAnswers }
    })
  }

  function toggleBookmark(questionId: string) {
    setState(prev => {
      const newBookmarks = new Set(prev.bookmarks)
      if (newBookmarks.has(questionId)) {
        newBookmarks.delete(questionId)
      } else {
        newBookmarks.add(questionId)
      }
      return { ...prev, bookmarks: newBookmarks }
    })
  }

  async function handleSaveAndExit() {
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const drafts = state.questions.map(q => ({
        attempt_id: attemptId,
        question_id: q.id,
        user_id: user.id,
        selected_answer: state.answers.get(q.id) ?? null,
        bookmarked: state.bookmarks.has(q.id),
      }))

      const { error } = await supabase
        .from('sabiquiz_draft_responses')
        .upsert(drafts, { 
          onConflict: 'attempt_id,question_id',
          ignoreDuplicates: false 
        })

      if (error) throw error

      await supabase
        .from('sabiquiz_attempts')
        .update({ status: 'in_progress' })
        .eq('id', attemptId)

      router.push('/sabiquiz/materials')
    } catch (err: any) {
      console.error('Error saving progress:', err)
      setError('Failed to save progress')
      setSaving(false)
    }
  }

  async function handleSubmit() {
    if (state.answers.size === 0 && quizMode !== 'time_attack') {
      toast.warning('Please answer at least one question')
      return
    }

    const unanswered = state.questions.filter(q => !state.answers.has(q.id))
    if (unanswered.length > 0 && quizMode === 'normal') {
      const confirm = window.confirm(
        `You have ${unanswered.length} unanswered question(s). Submit anyway?`
      )
      if (!confirm) return
    }

    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const totalTime = Math.floor((Date.now() - state.startTime) / 1000)
      const avgTimePerQuestion = Math.floor(totalTime / state.questions.length)

      const responses = state.questions.map(q => {
        const selectedAnswer = state.answers.get(q.id)
        const isCorrect = selectedAnswer === q.correct_answer
        
        return {
          attempt_id: attemptId,
          question_id: q.id,
          user_id: user.id,
          selected_answer: selectedAnswer ?? null,
          correct: selectedAnswer !== undefined ? isCorrect : null,
          time_seconds: avgTimePerQuestion,
          bookmarked: state.bookmarks.has(q.id),
        }
      })

      const { error: responseError } = await supabase
        .from('sabiquiz_responses')
        .insert(responses)

      if (responseError) throw responseError

      const correctCount = responses.filter(r => r.correct === true).length
      const score = Math.round((correctCount / state.questions.length) * 100)

      const { error: updateError } = await supabase
        .from('sabiquiz_attempts')
        .update({
          correct_answers: correctCount,
          score,
          time_taken_seconds: totalTime,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', attemptId)

      if (updateError) throw updateError

      await supabase
        .from('sabiquiz_draft_responses')
        .delete()
        .eq('attempt_id', attemptId)

      // Update streak, mastery, XP, and badges
      updateStreakAndMastery(user.id, attemptId)
        .then(async result => {
          console.log('🔥 Streak:', result.streak.currentStreak, 'days')
          console.log('📊 Topics updated:', result.mastery.updatedTopics.length)
          
          const xpResult = await awardXP(
            user.id,
            attemptId,
            correctCount,
            state.questions.length,
            result.streak.currentStreak
          )
          console.log('⭐ XP earned:', xpResult.xpEarned, '| Total:', xpResult.newTotal, '| Level:', xpResult.newLevel)
          
          if (xpResult.leveledUp) {
            console.log('🎉 LEVEL UP! Now level', xpResult.newLevel)
          }
          
          const badgeResult = await checkAndAwardBadges(user.id, attemptId)
          if (badgeResult.badgeEarned) {
            console.log('🏅 Badge earned:', badgeResult.badgeName)
          }
        })
        .catch(err => console.error('Streak/mastery/XP update failed:', err))

      router.push(`/sabiquiz/results/${attemptId}`)

    } catch (err: any) {
      console.error('Error submitting quiz:', err)
      setError('Failed to submit quiz. Please try again.')
      setSubmitting(false)
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  async function handleExplosionComplete() {
    setShowExplosion(false)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/sabiquiz/results/${attemptId}`)
        return
      }

      const totalTime = Math.floor((Date.now() - state.startTime) / 1000)
      const avgTimePerQuestion = state.questions.length > 0 ? Math.floor(totalTime / state.questions.length) : 0

      const responses = state.questions.map(q => {
        const selectedAnswer = state.answers.get(q.id)
        const isCorrect = selectedAnswer === q.correct_answer
        
        return {
          attempt_id: attemptId,
          question_id: q.id,
          user_id: user.id,
          selected_answer: selectedAnswer ?? null,
          correct: selectedAnswer !== undefined ? isCorrect : null,
          time_seconds: avgTimePerQuestion,
          bookmarked: state.bookmarks.has(q.id),
        }
      })

      await supabase
        .from('sabiquiz_responses')
        .insert(responses)

      const correctCount = responses.filter(r => r.correct === true).length
      const score = Math.round((correctCount / state.questions.length) * 100)

      await supabase
        .from('sabiquiz_attempts')
        .update({
          correct_answers: correctCount,
          score,
          time_taken_seconds: totalTime,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', attemptId)

      await supabase
        .from('sabiquiz_draft_responses')
        .delete()
        .eq('attempt_id', attemptId)

      // Update streak, mastery, XP (non-blocking)
      updateStreakAndMastery(user.id, attemptId)
        .then(async result => {
          const xpResult = await awardXP(user.id, attemptId, correctCount, state.questions.length, result.streak.currentStreak)
          await checkAndAwardBadges(user.id, attemptId)
        })
        .catch(err => console.error('Post-quiz updates failed:', err))

      router.push(`/sabiquiz/results/${attemptId}`)
    } catch (err) {
      console.error('Error submitting after timeout:', err)
      router.push(`/sabiquiz/results/${attemptId}`)
    }
  }

  function handlePerfectRunEndComplete() {
    setShowPerfectRunEnd(false)
    handleSubmit()
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <SabiLoader text="Loading your quiz..." size="lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full rounded-2xl border-0 shadow-xl">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <Button 
              onClick={() => router.back()} 
              variant="outline" 
              className="w-full rounded-xl h-11"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const answeredCount = state.answers.size
  const totalQuestions = state.questions.length
  const bookmarkedCount = state.bookmarks.size
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0
  const timeProgressPercent = timeLimit && timeRemaining !== null 
    ? ((timeLimit - timeRemaining) / timeLimit) * 100 
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimationStyles />

      {/* Explosion Overlay for Time Attack */}
      {showExplosion && <ExplosionOverlay onComplete={handleExplosionComplete} />}

      {/* Perfect Run End Overlay */}
      {showPerfectRunEnd && (
        <PerfectRunEndOverlay 
          success={!perfectRunFailed && answeredCount === totalQuestions}
          streak={perfectRunStreak}
          total={totalQuestions}
          onComplete={handlePerfectRunEndComplete}
        />
      )}
      
      {/* Enhanced Sticky Header with Dark Gradient */}
      <div className="sticky top-0 z-10 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-lg">
        {/* Floating Decorative Elements */}
        <div className="absolute top-2 right-[15%] w-16 h-16 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-2xl rotate-12 blur-sm" />
        <div className="absolute bottom-2 left-[10%] w-12 h-12 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl -rotate-12 blur-sm" />
        
        <div className="relative max-w-5xl mx-auto px-4 pt-4 pb-3">
          {/* Controls and Stats */}
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={handleSaveAndExit}
              variant="ghost"
              size="sm"
              disabled={submitting || saving || quizMode === 'time_attack'}
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Save & Exit
                </>
              )}
            </Button>
            
            <div className="flex items-center gap-3 text-sm">
              {/* Mode Badge */}
              {quizMode !== 'normal' && (
                <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  quizMode === 'time_attack' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                  quizMode === 'perfect_run' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                  quizMode === 'boss_quiz' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                  'bg-white/10 text-white/70'
                }`}>
                  {quizMode === 'time_attack' && <><Zap className="w-3 h-3" /> Time Attack</>}
                  {quizMode === 'perfect_run' && <><Trophy className="w-3 h-3" /> Perfect Run</>}
                  {quizMode === 'boss_quiz' && <><Skull className="w-3 h-3" /> Boss Quiz</>}
                </div>
              )}
              
              {/* Timer for normal mode */}
              {quizMode === 'normal' && (
                <div className="flex items-center gap-1.5 text-white/70 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-medium">{formatTime(elapsedTime)}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1.5 bg-green-500/20 text-green-300 px-3 py-1.5 rounded-xl border border-green-500/30">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">{answeredCount}/{totalQuestions}</span>
              </div>
              
              {bookmarkedCount > 0 && (
                <div className="flex items-center gap-1.5 bg-yellow-500/20 text-yellow-300 px-3 py-1.5 rounded-xl border border-yellow-500/30">
                  <Bookmark className="w-4 h-4" />
                  <span>{bookmarkedCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar - Different for each mode */}
          <div className="py-2">
            {quizMode === 'time_attack' && timeRemaining !== null ? (
              <TimeAttackFuse 
                progress={timeProgressPercent} 
                timeRemaining={timeRemaining}
                isExploding={showExplosion}
              />
            ) : quizMode === 'perfect_run' ? (
              <PerfectRunStreak 
                streak={perfectRunStreak} 
                total={totalQuestions}
                failed={perfectRunFailed}
              />
            ) : quizMode === 'boss_quiz' ? (
              <BossQuizIndicator 
                questionsAnswered={answeredCount} 
                total={totalQuestions}
              />
            ) : (
              <ProgressBarWithCharacter 
                progress={progressPercent} 
                character={character} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {state.questions.map((question, index) => {
            const selectedAnswer = state.answers.get(question.id)
            const isBookmarked = state.bookmarks.has(question.id)
            const isAnswered = selectedAnswer !== undefined
            
            // For perfect run, show if answer was correct/wrong
            const showResult = quizMode === 'perfect_run' && isAnswered
            const isCorrect = selectedAnswer === question.correct_answer

            return (
              <Card 
                key={question.id} 
                className={`rounded-2xl border-0 shadow-sm hover:shadow-md transition-all duration-300 ${
                  isBookmarked ? 'ring-2 ring-yellow-400 ring-offset-2' : ''
                } ${
                  showResult && !isCorrect ? 'ring-2 ring-red-400 ring-offset-2 bg-red-50' : ''
                } ${showResult && isCorrect ? 'ring-2 ring-green-400 ring-offset-2 bg-green-50' : ''}`}
              >
                <CardContent className="p-5 sm:p-6">
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm ${
                          quizMode === 'boss_quiz' 
                            ? 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/30' 
                            : 'bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/20'
                        }`}>
                          {index + 1}
                        </span>
                        {question.difficulty && (
                          <span className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                            question.difficulty === 'easy' ? 'bg-green-100 text-green-700 border border-green-200' :
                            question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                            'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                            {question.difficulty}
                          </span>
                        )}
                        {isAnswered && !showResult && (
                          <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium bg-green-50 px-2.5 py-1 rounded-lg">
                            <CheckCircle className="w-4 h-4" />
                            Answered
                          </div>
                        )}
                        {showResult && isCorrect && (
                          <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium bg-green-100 px-2.5 py-1 rounded-lg">
                            <CheckCircle className="w-4 h-4" /> Correct!
                          </div>
                        )}
                        {showResult && !isCorrect && (
                          <div className="flex items-center gap-1.5 text-red-600 text-sm font-medium bg-red-100 px-2.5 py-1 rounded-lg">
                            <X className="w-4 h-4" /> Wrong
                          </div>
                        )}
                      </div>
                      <p className="text-lg font-medium text-gray-900 leading-relaxed">{question.question}</p>
                    </div>
                    
                    {quizMode !== 'time_attack' && (
                      <Button
                        onClick={() => toggleBookmark(question.id)}
                        variant="ghost"
                        size="sm"
                        className={`rounded-xl h-10 w-10 p-0 ${isBookmarked ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'}`}
                      >
                        {isBookmarked ? <Bookmark className="w-5 h-5 fill-current" /> : <Bookmark className="w-5 h-5" />}
                      </Button>
                    )}
                  </div>

                  {/* Answer Options - FULLY CLICKABLE AREAS */}
                  <div className="space-y-3">
                    {question.options.map((option, optIndex) => {
                      const isSelected = selectedAnswer === optIndex
                      const isCorrectOption = question.correct_answer === optIndex
                      
                      // Show correct answer in perfect run after wrong answer
                      const showCorrectHighlight = showResult && !isCorrect && isCorrectOption
                      const showWrongHighlight = showResult && !isCorrect && isSelected
                      
                      return (
                        <button
                          key={optIndex}
                          type="button"
                          onClick={() => !perfectRunFailed && handleAnswerSelect(question.id, optIndex)}
                          disabled={perfectRunFailed}
                          className={`w-full flex items-center gap-4 p-4 sm:p-5 border-2 rounded-2xl text-left transition-all duration-200 ${
                            showWrongHighlight
                              ? 'border-red-500 bg-red-100 shadow-md'
                              : showCorrectHighlight
                                ? 'border-green-500 bg-green-100 shadow-md'
                                : isSelected
                                  ? 'border-red-500 bg-red-50 shadow-md ring-2 ring-red-200'
                                  : 'border-gray-200 bg-white hover:border-red-300 hover:bg-gray-50 hover:shadow-sm'
                          } ${perfectRunFailed ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                        >
                          {/* Custom Radio Circle */}
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'border-red-500 bg-red-500' 
                              : showCorrectHighlight 
                                ? 'border-green-500 bg-green-500'
                                : showWrongHighlight
                                  ? 'border-red-500 bg-red-500'
                                  : 'border-gray-300 bg-white'
                          }`}>
                            {(isSelected || showCorrectHighlight || showWrongHighlight) && (
                              <div className="w-2.5 h-2.5 rounded-full bg-white" />
                            )}
                          </div>
                          
                          {/* Option Label */}
                          <span className={`font-bold text-sm ${
                            isSelected ? 'text-red-600' : 
                            showCorrectHighlight ? 'text-green-600' :
                            showWrongHighlight ? 'text-red-600' :
                            'text-gray-500'
                          }`}>
                            {String.fromCharCode(65 + optIndex)}.
                          </span>
                          
                          {/* Option Text */}
                          <span className={`flex-1 font-medium ${
                            isSelected ? 'text-gray-900' : 
                            showCorrectHighlight ? 'text-green-900' :
                            showWrongHighlight ? 'text-red-900' :
                            'text-gray-700'
                          }`}>
                            {option}
                          </span>
                          
                          {/* Result Icons */}
                          {showCorrectHighlight && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
                          {showWrongHighlight && <X className="w-5 h-5 text-red-600 flex-shrink-0" />}
                        </button>
                      )
                    })}
                  </div>

                  {question.topic && (
                    <div className="mt-5 pt-4 border-t border-gray-100">
                      <span className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                        <HelpCircle className="w-3.5 h-3.5" />
                        Topic: {question.topic}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Submit Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 mt-8 -mx-4 px-4 py-4 shadow-lg rounded-t-2xl">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="text-sm text-gray-600 flex-1">
              {perfectRunFailed ? (
                <span className="text-red-600 font-medium">
                  Perfect run ended at {perfectRunStreak}/{totalQuestions}
                </span>
              ) : answeredCount === totalQuestions ? (
                <span className="text-green-600 font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  All questions answered!
                </span>
              ) : (
                <span>{totalQuestions - answeredCount} question(s) remaining</span>
              )}
            </div>

            {/* Centered Timer for Time Attack */}
            {quizMode === 'time_attack' && timeRemaining !== null && (
              <div className="flex-1 flex justify-center">
                <FloatingTimer timeRemaining={timeRemaining} isAlarm={showAlarm} />
              </div>
            )}
            
            <div className="flex-1 flex justify-end">
              <Button
                onClick={() => {
                  if (quizMode === 'perfect_run' && answeredCount === totalQuestions && !perfectRunFailed) {
                    setShowPerfectRunEnd(true)
                  } else {
                    handleSubmit()
                  }
                }}
                disabled={submitting || (answeredCount === 0 && quizMode !== 'time_attack') || saving}
                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-6 sm:px-8 h-12 rounded-xl shadow-lg shadow-red-500/20 transition-all"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  `Submit Quiz (${answeredCount}/${totalQuestions})`
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}