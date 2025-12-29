'use client'

import { 
  PenLine, 
  ScanSearch, 
  Sparkles, 
  FileSearch,
  Settings
} from 'lucide-react'

type ActiveTool = 'writing' | 'detection' | 'humanize' | 'plagiarism' | 'settings'

interface ToolPanelProps {
  activeTool: ActiveTool
  onToolChange: (tool: ActiveTool) => void
  planTier: string
}

const TOOLS = [
  {
    id: 'writing' as ActiveTool,
    name: 'Writing Assistant',
    icon: PenLine,
    description: 'Rewrite, shorten, expand',
    costLabel: 'From ₦30'
  },
  {
    id: 'detection' as ActiveTool,
    name: 'AI Detection',
    icon: ScanSearch,
    description: 'Check AI probability',
    costLabel: 'From ₦100'
  },
  {
    id: 'humanize' as ActiveTool,
    name: 'Humanizer',
    icon: Sparkles,
    description: 'Make text natural',
    costLabel: 'From ₦150'
  },
  {
    id: 'plagiarism' as ActiveTool,
    name: 'Plagiarism Check',
    icon: FileSearch,
    description: 'Check similarity',
    costLabel: 'From ₦200'
  }
]

export default function ToolPanel({ activeTool, onToolChange, planTier }: ToolPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Tools List */}
      <div className="flex-1 p-4 space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Tools</p>
        
        {TOOLS.map((tool) => {
          const Icon = tool.icon
          const isActive = activeTool === tool.id
          
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`
                w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors
                ${isActive 
                  ? 'bg-red-50 border border-red-200' 
                  : 'hover:bg-gray-50 border border-transparent'
                }
              `}
            >
              <div className={`
                p-2 rounded-lg
                ${isActive ? 'bg-red-100' : 'bg-gray-100'}
              `}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-600' : 'text-gray-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isActive ? 'text-red-900' : 'text-gray-900'}`}>
                  {tool.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{tool.description}</p>
                <p className={`text-xs mt-1 ${isActive ? 'text-red-600' : 'text-gray-400'}`}>
                  {tool.costLabel}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Settings */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => onToolChange('settings')}
          className={`
            w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors
            ${activeTool === 'settings' 
              ? 'bg-gray-100' 
              : 'hover:bg-gray-50'
            }
          `}
        >
          <Settings className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">Settings</span>
        </button>
      </div>
    </div>
  )
}