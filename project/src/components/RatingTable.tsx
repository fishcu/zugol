'use client'

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
              <td className="bg-gray-700 text-white p-2 border border-gray-600 font-medium text-center">
                Handicap stones
              </td>
            </tr>
            {tableData.map((row, rowIndex) => (
              <tr key={row.handicap}>
                {row.komiValues.map((komi, komiIndex) => {
                  const isHighlighted = highlightPosition && 
                    highlightPosition.handicapStones === row.handicap && 
                    highlightPosition.komiIndex === komiIndex
                  
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
                      className={`p-2 border border-gray-600 text-center text-sm ${
                        isHighlighted
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                      title={`Rating difference: ${ratingDifference} points`}
                    >
                      {ratingDifference}
                    </td>
                  )
                })}
                <td className="bg-gray-700 text-white p-2 border border-gray-600 font-medium text-center">
                  {row.handicap}
                </td>
              </tr>
            ))}
            {/* Komi row at the bottom */}
            <tr>
              {Array.from({ length: 13 }, (_, i) => (
                <td key={i} className="bg-gray-600 text-gray-300 p-2 border border-gray-600 text-sm text-center">
                  {formatKomi(6.5 - i)}
                </td>
              ))}
              <td className="bg-gray-600 text-gray-300 p-2 border border-gray-600 font-medium text-center">
                Komi
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-400 space-y-1">
        <p>• Each cell shows the rating point difference</p>
        <p>• Right column = Handicap stones (0 = even game, then 2-9)</p>
        <p>• Bottom row = Komi value ({formatKomi(6.5)} to {formatKomi(-5.5)})</p>
        {highlightPosition && (
          <p className="text-blue-400 font-medium">
            • Highlighted cell shows current game settings
          </p>
        )}
      </div>
    </div>
  )
} 