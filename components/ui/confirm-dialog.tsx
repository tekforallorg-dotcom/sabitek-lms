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
  info: 'bg-blue-600',
  success: 'bg-green-600',
  error: 'bg-red-600',
  warning: 'bg-amber-600',
  confirm: 'bg-amber-600',
}

function getButtonClass(variant?: string) {
  switch (variant) {
    case 'primary':
      return 'bg-red-600 hover:bg-red-700 text-white'
    case 'danger':
      return 'bg-red-600 hover:bg-red-700 text-white'
    case 'secondary':
    default:
      return ''
  }
}

export function ConfirmDialog({ isOpen, onClose, title, message, type = 'confirm', actions }: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white border border-gray-200 rounded-xl shadow-sm max-w-md w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className={`${bgMap[type]} p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              {iconMap[type]}
            </div>
            <h3 className="text-lg font-medium text-white">{title}</h3>
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