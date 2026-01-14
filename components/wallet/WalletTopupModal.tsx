'use client'

import { useState } from 'react'
import { X, Wallet, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useWallet } from '@/hooks/useWallet'

interface WalletTopupModalProps {
  isOpen: boolean
  onClose: () => void
  /** Custom callback URL after payment */
  callbackUrl?: string
}

export function WalletTopupModal({ 
  isOpen, 
  onClose,
  callbackUrl 
}: WalletTopupModalProps) {
  const { balance, presets, limits, initializeTopup, isLoading } = useWallet()
  
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handlePresetSelect = (kobo: number) => {
    setSelectedPreset(kobo)
    setCustomAmount('')
    setError(null)
  }

  const handleCustomAmountChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '')
    setCustomAmount(numericValue)
    setSelectedPreset(null)
    setError(null)
  }

  const getAmountKobo = (): number => {
    if (selectedPreset) return selectedPreset
    if (customAmount) return parseInt(customAmount) * 100 // Convert Naira to Kobo
    return 0
  }

  const formatAmount = (kobo: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(kobo / 100)
  }

  const handleTopup = async () => {
    const amountKobo = getAmountKobo()
    
    if (!amountKobo) {
      setError('Please select or enter an amount')
      return
    }

    if (limits) {
      if (amountKobo < limits.min_kobo) {
        setError(`Minimum amount is ${limits.min_formatted}`)
        return
      }
      if (amountKobo > limits.max_kobo) {
        setError(`Maximum amount is ${limits.max_formatted}`)
        return
      }
    }

    setIsProcessing(true)
    setError(null)

    try {
      const result = await initializeTopup(amountKobo, callbackUrl)
      
      if (result) {
        // Redirect to Paystack
        window.location.href = result.authorizationUrl
      } else {
        setError('Failed to initialize payment. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsProcessing(false)
    }
  }

  const amountKobo = getAmountKobo()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Top Up Wallet</h2>
              <p className="text-sm text-gray-500">
                Balance: {balance?.balanceFormatted || '₦0'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Preset amounts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Select
            </label>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.kobo}
                  onClick={() => handlePresetSelect(preset.kobo)}
                  className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                    selectedPreset === preset.kobo
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Enter Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                ₦
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                className={`w-full pl-8 pr-4 py-3 border rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  customAmount ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
            {limits && (
              <p className="text-xs text-gray-500 mt-1">
                Min: {limits.min_formatted} • Max: {limits.max_formatted}
              </p>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Summary */}
          {amountKobo > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Amount to add</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatAmount(amountKobo)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                <span className="text-gray-600">New balance</span>
                <span className="text-lg font-semibold text-green-600">
                  {formatAmount((balance?.balanceKobo || 0) + amountKobo)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleTopup}
            disabled={!amountKobo || isProcessing}
            className="w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Proceed to Payment
                {amountKobo > 0 && ` • ${formatAmount(amountKobo)}`}
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Secured by Paystack. Card, Bank Transfer, or USSD.
          </p>
        </div>
      </div>
    </div>
  )
}

// Success modal shown after payment verification
interface TopupSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  amount: string
  newBalance: string
}

export function TopupSuccessModal({ 
  isOpen, 
  onClose, 
  amount, 
  newBalance 
}: TopupSuccessModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Top Up Successful!
        </h2>
        
        <p className="text-gray-600 mb-4">
          {amount} has been added to your wallet.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500">New Balance</p>
          <p className="text-2xl font-bold text-green-600">{newBalance}</p>
        </div>
        
        <button
          onClick={onClose}
          className="w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  )
}