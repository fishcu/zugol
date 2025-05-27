# Zugol - Go Rating System

A Next.js application for tracking Go (Weiqi/Baduk) player ratings with a sophisticated rank stability system.

## Features

- **Player Rating System**: Traditional Go ranks (25k-9d) with point-based calculations
- **Rank Stability**: Prevents rank oscillation with a 5-game freeze period after rank changes
- **Visual Feedback**: Asterisk notation (*) shows recently changed ranks
- **Real-time Updates**: Live rating and rank updates after each game

## Database Setup

Run the migration in your Supabase SQL editor:

```sql
-- Use either the simplified migration for existing databases:
-- supabase-simplified-rank-migration.sql

-- Or the complete setup for new databases:
-- supabase-final-migration.sql
```

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Testing

Visit `/test-ranking` to test the rank stability system:
- Simulate wins and losses
- Observe rank changes and asterisk behavior
- Test the 5-game freeze period

## Rank System

- **Rating Points**: Each rank spans 13 points (25k=0-12, 24k=13-25, etc.)
- **New Players**: Start at 15k (137 points)
- **Rank Changes**: Only occur when outside the 5-game freeze period
- **Display Logic**: Shows frozen rank with asterisk during freeze period

## Documentation

See `RANK_STABILITY_SYSTEM.md` for detailed information about the rank stability implementation.

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Deployment**: Vercel
