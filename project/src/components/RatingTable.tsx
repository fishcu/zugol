'use client'

import { useState } from 'react'
import { generateRatingTable, getTablePosition, formatKomi } from '@/lib/gameSettings'

interface RatingTableProps {
  highlightRatingDifference?: number
  className?: string
}

export default function RatingTable({ highlightRatingDifference, className = '' }: RatingTableProps) {
  const tableData = generateRatingTable(9)
  const highlightPosition = highlightRatingDifference !== undefined 
    ? getTablePosition(highlightRatingDifference) 
    : null

  const [hoveredCell, setHoveredCell] = useState<{ rowIndex: number; komiIndex: number } | null>(null)

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <h3 className="text-xl font-bold text-white mb-4 text-center">
        Points Difference & Game Settings
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {/* Header row */}
            <tr>
              <td className="bg-gray-800 text-white p-2 border border-gray-600 font-medium text-center" colSpan={13}>
                Points difference
              </td>
              <td className="bg-indigo-900 text-indigo-100 p-2 border border-indigo-700 font-medium text-center">
                Handicap stones
              </td>
            </tr>
            {tableData.map((row, rowIndex) => (
              <tr key={row.handicap}>
                {row.komiValues.map((komi, komiIndex) => {
                  const isHighlighted = highlightPosition && 
                    highlightPosition.handicapStones === row.handicap && 
                    highlightPosition.komiIndex === komiIndex
                  
                  const isHovered = hoveredCell?.rowIndex === rowIndex && hoveredCell?.komiIndex === komiIndex
                  
                  // Calculate the actual rating difference for this cell
                  let ratingDifference
                  if (rowIndex === 0) {
                    // First row: 0-12 points difference
                    ratingDifference = komiIndex
                  } else {
                    // Subsequent rows: start at 13 + (rowIndex-1)*13 + komiIndex
                    ratingDifference = 13 + (rowIndex - 1) * 13 + komiIndex
                  }
                  
                  return (
                    <td
                      key={komiIndex}
                      className={`p-2 border border-gray-600 text-center text-sm transition-colors duration-150 cursor-pointer ${
                        isHighlighted
                          ? 'bg-amber-600 text-white font-bold'
                          : isHovered
                          ? 'bg-gray-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-600'
                      }`}
                      onMouseEnter={() => setHoveredCell({ rowIndex, komiIndex })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {ratingDifference}
                    </td>
                  )
                })}
                <td className={`p-2 border border-indigo-700 font-medium text-center transition-colors duration-150 ${
                  // Show hover effect if this row is hovered
                  hoveredCell?.rowIndex === rowIndex
                    ? 'bg-indigo-600 text-indigo-100'
                    // Show highlight effect if this row matches the highlighted position and nothing is hovered
                    : !hoveredCell && highlightPosition && highlightPosition.handicapStones === row.handicap
                    ? 'bg-indigo-600 text-indigo-100'
                    // Default state
                    : 'bg-indigo-900 text-indigo-100'
                }`}>
                  {row.handicap}
                </td>
              </tr>
            ))}
            {/* Komi row at the bottom */}
            <tr>
              {Array.from({ length: 13 }, (_, i) => (
                <td key={i} className={`p-2 border border-teal-700 text-sm text-center transition-colors duration-150 ${
                  // Show hover effect if this column is hovered
                  hoveredCell?.komiIndex === i 
                    ? 'bg-teal-600 text-teal-100'
                    // Show highlight effect if this column matches the highlighted position and nothing is hovered
                    : !hoveredCell && highlightPosition && highlightPosition.komiIndex === i
                    ? 'bg-teal-600 text-teal-100'
                    // Default state
                    : 'bg-teal-900 text-teal-100'
                }`}>
                  {formatKomi(6.5 - i)}
                </td>
              ))}
              <td className="bg-teal-900 text-teal-100 p-2 border border-teal-700 font-medium text-center">
                Komi
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-400 space-y-1">
        <p>• Hover over any cell to see corresponding handicap stones and komi</p>
        <p>• Each cell shows the rating point difference</p>
        <p>• Right column = Handicap stones (0 = even game, then 2-9)</p>
        <p>• Bottom row = Komi value ({formatKomi(6.5)} to {formatKomi(-5.5)})</p>
        {highlightPosition && (
          <p className="text-amber-400 font-medium">
            • Highlighted cell shows current game settings
          </p>
        )}
        {highlightRatingDifference !== undefined && !highlightPosition && (
          <p className="text-red-400 font-medium">
            • Rating difference ({highlightRatingDifference} pts) exceeds table range — using 9 handicap stones with extended komi
          </p>
        )}
      </div>
    </div>
  )
} 