'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import Ladder from '@/components/Ladder'

export default function HomePage() {
  const { user, profile, loading, signOut, getDisplayRank } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="layout-container">
      <main className="main-content">
        <div className="bg-gray-900 flex flex-col h-full">
          {/* Header with user status */}
          {user && profile && (
            <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
              <div className="max-w-4xl mx-auto flex justify-between items-center">
                <div className="text-sm text-gray-300">
                  Signed in as <span className="text-white font-medium">{profile.name}</span>
                  <span className="text-gray-400 ml-2">({getDisplayRank()})</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md w-full">
              <h1 className="text-6xl font-bold text-white mb-4">
                ⚫Zugol⚪
              </h1>
              <p className="text-xl text-gray-400 mb-12">
                Zurich Go Ladder
              </p>
              
              {user && profile ? (
                <div className="space-y-6">
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-white mb-2">Welcome back, {profile.name}!</h2>
                    <p className="text-gray-300 mb-4">
                      Current rank: <span className="text-blue-400 font-medium">
                        {getDisplayRank()}
                      </span>
                    </p>
                    <p className="text-gray-300 mb-6">
                      Rating points: <span className="text-blue-400 font-medium">
                        {profile.rating_points}
                      </span>
                    </p>
                    <button
                      onClick={handleSignOut}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-colors">
                      Report Game Result
                    </button>
                    <Link
                      href="/test-ranking"
                      className="block w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-medium transition-colors text-center"
                    >
                      Test Ranking System
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Link
                    href="/register"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                  >
                    Register
                  </Link>
                  <Link
                    href="/login"
                    className="block w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Ladder />
    </div>
  )
}
