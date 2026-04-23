'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle, AlertCircle, CheckCircle, X, Info } from 'lucide-react'

export interface ConfirmDialogAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
}

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'info' | 'success' | 'error' | 'warning' | 'confirm'
  actions?: ConfirmDialogAction[]
}

const iconMap = {
  info: <Info className="w-6 h-6 text-blue-500" />,
  success: <CheckCircle className="w-6 h-6 text-green-500" />,
  error: <X className="w-6 h-6 text-red-500" />,
  warning: <AlertTriangle className="w-6 h-6 text-amber-500" />,
  confirm: <AlertTriangle className="w-6 h-6 text-amber-500" />,
}

const bgMap = {
  info: 'from-blue-500 to-blue-600',
  success: 'from-green-500 to-emerald-600',
  error: 'from-red-500 to-red-600',
  warning: 'from-amber-500 to-orange-500',
  confirm: 'from-amber-500 to-orange-500',
}

function getButtonClass(variant?: string) {
  switch (variant) {
    case 'primary':
      return 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white'
    case 'danger':
      return 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
    case 'secondary':
    default:
      return ''
  }
}

export function ConfirmDialog({ isOpen, onClose, title, message, type = 'confirm', actions }: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className={`bg-gradient-to-r ${bgMap[type]} p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              {iconMap[type]}
            </div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>
        </div>
        <div className="p-5">
          <p className="text-gray-600 text-sm whitespace-pre-line">{message}</p>
        </div>
        <div className="px-5 pb-5 flex gap-3 justify-end">
          {actions ? (
            actions.map((action, i) => (
              <Button
                key={i}
                onClick={action.onClick}
                variant={action.variant === 'secondary' ? 'outline' : 'default'}
                className={`rounded-xl ${getButtonClass(action.variant)}`}
                size="sm"
              >
                {action.label}
              </Button>
            ))
          ) : (
            <Button onClick={onClose} variant="outline" className="rounded-xl" size="sm">
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}