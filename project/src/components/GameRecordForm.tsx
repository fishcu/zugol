'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createGame } from '@/lib/gamesUtils'

interface GameRecordFormProps {
  blackPlayerId: string
  whitePlayerId: string
  blackPlayerName: string
  whitePlayerName: string
  onGameRecorded?: () => void
  className?: string
}

export default function GameRecordForm({
  blackPlayerId,
  whitePlayerId,
  blackPlayerName,
  whitePlayerName,
  onGameRecorded,
  className = ''
}: GameRecordFormProps) {
  const router = useRouter()
  const [playedAt, setPlayedAt] = useState(() => {
    // Default to today's date in YYYY-MM-DD format
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [winner, setWinner] = useState<'black' | 'white' | 'draw' | ''>('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [modalState, setModalState] = useState<'confirm' | 'success'>('confirm')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!winner) {
      setSubmitResult({ success: false, message: 'Please select a winner' })
      return
    }

    // Show confirmation modal
    setModalState('confirm')
    setShowConfirmModal(true)
  }

  const handleConfirmRecord = async () => {
    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const result = await createGame({
        played_at: playedAt + 'T12:00:00Z', // Add time component for full timestamp
        black_player_id: blackPlayerId,
        white_player_id: whitePlayerId,
        winner: winner as 'black' | 'white' | 'draw',
        notes: notes.trim() || undefined
      })

      if (result.success) {
        // Switch modal to success state instead of showing new modal
        setModalState('success')
        
        // Notify parent component
        if (onGameRecorded) {
          onGameRecorded()
        }
      } else {
        setSubmitResult({ success: false, message: result.error || 'Failed to record game' })
      }
    } catch (error) {
      setSubmitResult({ success: false, message: 'Unexpected error occurred' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getWinnerDisplayText = (winnerValue: string) => {
    switch (winnerValue) {
      case 'black':
        return `${blackPlayerName} (Black) wins`
      case 'white':
        return `${whitePlayerName} (White) wins`
      case 'draw':
        return 'Drawn game'
      default:
        return 'Select winner...'
    }
  }

  const handleGoHome = () => {
    router.push('/')
  }

  const handlePlayAnother = () => {
    setShowConfirmModal(false)
    setModalState('confirm')
    // Reset form for next game
    setWinner('')
    setNotes('')
    setSubmitResult(null)
  }

  return (
    <>
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <h3 className="text-xl font-bold text-white mb-4">Record Game Result</h3>
        <p className="text-gray-400 text-sm mb-6">
          Record the outcome of your game for the ladder standings
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Game Date */}
          <div>
            <label htmlFor="playedAt" className="block text-sm font-medium text-gray-300 mb-2">
              Game Date
            </label>
            <input
              type="date"
              id="playedAt"
              value={playedAt}
              onChange={(e) => setPlayedAt(e.target.value)}
              className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Winner Selection */}
          <div>
            <label htmlFor="winner" className="block text-sm font-medium text-gray-300 mb-2">
              Game Result
            </label>
            <select
              id="winner"
              value={winner}
              onChange={(e) => setWinner(e.target.value as 'black' | 'white' | 'draw' | '')}
              className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">Select winner...</option>
              <option value="black">{blackPlayerName} (Black) wins</option>
              <option value="white">{whitePlayerName} (White) wins</option>
              <option value="draw">Drawn game</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
              Notes <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={1}
              maxLength={10000}
              className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-vertical"
            />
            <div className="text-xs text-gray-500 mt-1">
              {notes.length}/10,000 characters
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting || !winner}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              {isSubmitting ? 'Recording...' : 'Record Game...'}
            </button>

            {submitResult && !submitResult.success && (
              <div className="text-sm text-red-400">
                {submitResult.message}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Modal - switches between confirm and success states */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
            {modalState === 'confirm' ? (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Confirm Game Record</h2>
                  <p className="text-gray-400">
                    Are you sure you want to record this game?
                  </p>
                </div>

                <div className="bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="text-white space-y-2">
                    <div><strong>Date:</strong> {new Date(playedAt).toLocaleDateString()}</div>
                    <div><strong>Players:</strong> {blackPlayerName} (Black) vs {whitePlayerName} (White)</div>
                    <div><strong>Result:</strong> {getWinnerDisplayText(winner)}</div>
                    {notes && (
                      <div>
                        <strong>Notes:</strong>
                        <div className="mt-1 p-2 bg-gray-600 rounded text-sm max-h-20 overflow-y-auto break-words">
                          {notes.length > 200 ? `${notes.substring(0, 200)}...` : notes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRecord}
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    {isSubmitting ? 'Recording...' : 'Confirm Record'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Game Recorded!</h2>
                  <p className="text-gray-400">
                    Your game has been successfully recorded and added to the ladder standings.
                  </p>
                </div>

                <div className="bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="text-white space-y-2">
                    <div><strong>Date:</strong> {new Date(playedAt).toLocaleDateString()}</div>
                    <div><strong>Players:</strong> {blackPlayerName} (Black) vs {whitePlayerName} (White)</div>
                    <div><strong>Result:</strong> {getWinnerDisplayText(winner)}</div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handlePlayAnother}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Play Another Game
                  </button>
                  <button
                    type="button"
                    onClick={handleGoHome}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Go to Home
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
} 