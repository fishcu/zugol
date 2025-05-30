'use client'

import { useState, useEffect } from 'react'
import { supabase, getDisplayRank } from '@/lib/supabase'
import { getLastGameDate } from '@/lib/gamesUtils'
import { useAuth } from '@/contexts/AuthContext'

interface Profile {
  id: string
  name: string
  rating_points: number
  last_rank_reached: string
  games_since_last_rank_change: number
  created_at: string
  updated_at: string
}

type SortField = 'name' | 'rating_points' | 'last_game_played'
type SortDirection = 'asc' | 'desc'
type ActivityFilter = 'all' | '1month' | '3months' | '6months' | '1year'

export default function Ladder() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [lastGameDates, setLastGameDates] = useState<Record<string, string | null>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('rating_points')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('6months')

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')

      if (error) {
        setError('Failed to load ladder data')
        console.error('Error fetching profiles:', error)
        return
      }

      const profilesData = data || []
      setProfiles(profilesData)

      // Fetch last game dates for all players
      await fetchLastGameDates(profilesData)
    } catch (err) {
      setError('Unexpected error occurred')
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchLastGameDates = async (profilesData: Profile[]) => {
    try {
      const lastGamePromises = profilesData.map(async (profile) => {
        const result = await getLastGameDate(profile.id)
        return {
          playerId: profile.id,
          lastGameDate: result.success ? (result.lastGameDate || null) : null
        }
      })

      const results = await Promise.all(lastGamePromises)
      const lastGameDatesMap: Record<string, string | null> = {}
      
      results.forEach(({ playerId, lastGameDate }) => {
        lastGameDatesMap[playerId] = lastGameDate
      })

      setLastGameDates(lastGameDatesMap)
    } catch (err) {
      console.error('Error fetching last game dates:', err)
      // Continue without last game dates - will fall back to profile.updated_at
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection(field === 'name' ? 'asc' : 'desc')
    }
  }

  const getLastGameDateForProfile = (profile: Profile): string | null => {
    // Use actual last game date from games database
    const actualLastGameDate = lastGameDates[profile.id] || null
    if (actualLastGameDate) {
      return actualLastGameDate
    }
    
    // No games played - return null to show "—"
    return null
  }

  const getFilteredProfiles = () => {
    if (activityFilter === 'all') {
      return profiles
    }

    const now = new Date()
    let cutoffDate: Date

    switch (activityFilter) {
      case '1month':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        break
      case '3months':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        break
      case '6months':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
        break
      case '1year':
        cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        break
      default:
        return profiles
    }

    return profiles.filter(profile => {
      const lastGameDate = getLastGameDateForProfile(profile)
      if (!lastGameDate) return false // No games played
      
      const gameDate = new Date(lastGameDate)
      return gameDate >= cutoffDate
    })
  }

  const getSortedProfiles = () => {
    const filteredProfiles = getFilteredProfiles()
    return [...filteredProfiles].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'rating_points':
          // Prioritize players who have played games over those who haven't
          const aHasGames = !!getLastGameDateForProfile(a)
          const bHasGames = !!getLastGameDateForProfile(b)
          
          // If one has games and the other doesn't, always prioritize the one with games
          if (aHasGames && !bHasGames) return -1
          if (!aHasGames && bHasGames) return 1
          
          // If both have games or both don't have games, sort by rating points
          aValue = a.rating_points
          bValue = b.rating_points
          break
        case 'last_game_played':
          const aLastGame = getLastGameDateForProfile(a)
          const bLastGame = getLastGameDateForProfile(b)
          // Put players with no games at the end
          if (!aLastGame && !bLastGame) return 0
          if (!aLastGame) return 1
          if (!bLastGame) return -1
          aValue = new Date(aLastGame).getTime()
          bValue = new Date(bLastGame).getTime()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <span className="text-gray-500 ml-1">⇅</span>
    }
    return sortDirection === 'asc' 
      ? <span className="text-blue-400 ml-1">▲</span>
      : <span className="text-blue-400 ml-1">▼</span>
  }

  const formatLastGamePlayed = (profile: Profile): string => {
    const lastGameDate = getLastGameDateForProfile(profile)
    
    if (!lastGameDate) {
      return '—'
    }
    
    const date = new Date(lastGameDate)
    return date.toLocaleDateString()
  }

  const getLadderPosition = (profile: Profile, allProfiles: Profile[]) => {
    const sortedByRating = [...allProfiles].sort((a, b) => {
      // Prioritize players who have played games over those who haven't
      const aHasGames = !!getLastGameDateForProfile(a)
      const bHasGames = !!getLastGameDateForProfile(b)
      
      // If one has games and the other doesn't, prioritize the one with games
      if (aHasGames && !bHasGames) return -1
      if (!aHasGames && bHasGames) return 1
      
      // If both have games or both don't have games, sort by rating points (descending)
      return b.rating_points - a.rating_points
    })
    return sortedByRating.findIndex(p => p.id === profile.id) + 1
  }

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return <span className="medal-icon text-yellow-400" title="1st Place">🥇</span>
      case 2:
        return <span className="medal-icon text-gray-300" title="2nd Place">🥈</span>
      case 3:
        return <span className="medal-icon text-amber-600" title="3rd Place">🥉</span>
      default:
        return null
    }
  }

  const isCurrentUser = (profile: Profile) => {
    return user && user.id === profile.id
  }

  const getActivityFilterLabel = (filter: ActivityFilter) => {
    switch (filter) {
      case 'all': return 'All players'
      case '1month': return 'Active in last month'
      case '3months': return 'Active in last 3 months'
      case '6months': return 'Active in last 6 months'
      case '1year': return 'Active in last year'
      default: return 'All players'
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-800 border-t border-gray-700 p-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">🪜 Current Standings</h2>
          <div className="text-gray-400">Loading ladder...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800 border-t border-gray-700 p-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">🪜 Current Standings</h2>
          <div className="text-red-400">{error}</div>
        </div>
      </div>
    )
  }

  const sortedProfiles = getSortedProfiles()

  return (
    <div className="bg-gray-800 border-t border-gray-700 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">🪜 Current Standings</h2>
          
          {/* Activity Filter */}
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">Show:</span>
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value as ActivityFilter)}
              className="bg-gray-700 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All players</option>
              <option value="1month">Active in last month</option>
              <option value="3months">Active in last 3 months</option>
              <option value="6months">Active in last 6 months</option>
              <option value="1year">Active in last year</option>
            </select>
          </div>
        </div>
        
        {sortedProfiles.length === 0 ? (
          <div className="text-gray-400">
            {activityFilter === 'all' ? 'No players found' : `No players found with activity in the selected time period`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left table-fixed">
              <colgroup>
                <col className="w-16" />
                <col className="w-48" />
                <col className="w-40" />
                <col className="w-32" />
              </colgroup>
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="pb-3 text-gray-300 font-medium">Position</th>
                  <th 
                    className="pb-3 text-gray-300 font-medium cursor-pointer hover:text-white transition-colors select-none"
                    onClick={() => handleSort('name')}
                  >
                    Name{getSortIcon('name')}
                  </th>
                  <th 
                    className="pb-3 text-gray-300 font-medium cursor-pointer hover:text-white transition-colors select-none"
                    onClick={() => handleSort('rating_points')}
                  >
                    Points and Rank{getSortIcon('rating_points')}
                  </th>
                  <th 
                    className="pb-3 text-gray-300 font-medium cursor-pointer hover:text-white transition-colors select-none"
                    onClick={() => handleSort('last_game_played')}
                  >
                    Last Game{getSortIcon('last_game_played')}
                  </th>
                </tr>
              </thead>
              <tbody className="ladder-tbody">
                {sortedProfiles.map((profile) => {
                  const displayRank = getDisplayRank(profile)
                  const ladderPosition = getLadderPosition(profile, profiles)
                  const medalIcon = getMedalIcon(ladderPosition)
                  const isCurrentUserRow = isCurrentUser(profile)

                  return (
                    <tr 
                      key={profile.id} 
                      className={`border-b border-gray-700 ${
                        isCurrentUserRow ? 'current-user-row' : ''
                      }`}
                    >
                      <td className="py-3 text-gray-400 font-medium">
                        <div className="rank-cell">
                          {medalIcon ? (
                            medalIcon
                          ) : (
                            <span className="rank-number text-gray-400">#{ladderPosition}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 font-medium truncate">
                        <span className={isCurrentUserRow ? 'text-blue-200' : 'text-white'}>
                          {profile.name}
                          {isCurrentUserRow && (
                            <span className="text-blue-300 ml-2 text-sm">(You)</span>
                          )}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`font-medium ${isCurrentUserRow ? 'text-blue-200' : 'text-white'}`}>
                          {profile.rating_points} pts
                        </span>
                        <span className="text-blue-400 ml-2">
                          ({displayRank})
                        </span>
                      </td>
                      <td className="py-3 text-gray-400">
                        {formatLastGamePlayed(profile)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-500">
          {sortedProfiles.length} player{sortedProfiles.length !== 1 ? 's' : ''} • {getActivityFilterLabel(activityFilter)} • 
          Sorted by {sortField === 'rating_points' ? 'points and rank' : sortField === 'last_game_played' ? 'last game' : 'name'} 
          ({sortDirection === 'desc' ? 'highest first' : 'lowest first'})
        </div>
      </div>
    </div>
  )
} 