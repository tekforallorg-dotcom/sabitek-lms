'use client'

interface SabiLoaderProps {
  text?: string
  size?: 'sm' | 'md' | 'lg'
}

// Mini SabiBot head SVG icon
function SabiBotIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      {/* Head */}
      <rect x="4" y="6" width="16" height="14" rx="3" />
      {/* Antenna */}
      <rect x="11" y="2" width="2" height="4" />
      <circle cx="12" cy="2" r="2" />
      {/* Eyes */}
      <circle cx="9" cy="11" r="2" fill="white" />
      <circle cx="15" cy="11" r="2" fill="white" />
      {/* Smile */}
      <path d="M8 15.5 Q12 18 16 15.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export default function SabiLoader({ text = 'Loading...', size = 'md' }: SabiLoaderProps) {
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'
  const gap = size === 'sm' ? 'gap-1' : size === 'md' ? 'gap-1.5' : 'gap-2'
  const textSize = size === 'sm' ? 'text-[10px]' : size === 'md' ? 'text-xs' : 'text-sm'

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* SabiBot icons animation */}
      <div className={`flex items-center ${gap} mb-3`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="sabi-pulse"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            <SabiBotIcon className={iconSize} />
          </div>
        ))}
      </div>
      
      {/* Loading text */}
      <p className={`${textSize} text-gray-600 font-medium`}>{text}</p>

      <style jsx global>{`
        .sabi-pulse {
          color: #d1d5db;
          animation: sabiPulse 1.5s ease-in-out infinite;
        }
        
        @keyframes sabiPulse {
          0%, 100% {
            color: #d1d5db;
            transform: scale(1) translateY(0);
          }
          50% {
            color: #dc2626;
            transform: scale(1.2) translateY(-2px);
          }
        }
      `}</style>
    </div>
  )
}

// Simple dots version (alternative)
export function SabiLoaderDots({ text = 'Loading...', size = 'md' }: SabiLoaderProps) {
  const dotSize = size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-2.5 h-2.5' : 'w-3 h-3'
  const gap = size === 'sm' ? 'gap-1.5' : size === 'md' ? 'gap-2' : 'gap-2.5'
  const textSize = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Dots animation */}
      <div className={`flex items-center ${gap} mb-3`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${dotSize} rounded-full sabi-dot`}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      
      {/* Loading text */}
      <p className={`${textSize} text-gray-600 font-medium`}>{text}</p>

      <style jsx global>{`
        .sabi-dot {
          background-color: #d1d5db;
          animation: sabiDot 1.5s ease-in-out infinite;
        }
        
        @keyframes sabiDot {
          0%, 100% {
            background-color: #d1d5db;
            transform: scale(1) translateY(0);
          }
          50% {
            background-color: #dc2626;
            transform: scale(1.3) translateY(-3px);
          }
        }
      `}</style>
    </div>
  )
}