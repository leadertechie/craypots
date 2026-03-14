# Craypots - Multiplayer Crab Fishing Game

A real-time multiplayer web-based board game where players manage boats and crab pots to catch crabs across different ocean zones.

## Game Overview

**Craypots** is a competitive crab fishing game where:
- Players manage a fleet of **3 boats** (small, medium, large) and **9 crab pots** (2 large, 3 medium, 4 small)
- Deploy boats to ocean zones, then place pots on deployed boats
- **Shallow** (1x), **Medium** (2x), **Deep** (3x) point multipliers
- **Weather** affects gameplay: Calm (safe), Mild (15-30% pot loss), Heavy (lose all pots + risk boat)
- Score points by catching crabs; lose pots/boats to storms
- **Optional placement**: Use all or some boats/pots - more deployed = more points!
- Sessions last **24 hours** with automatic player offline detection

## Features

- 🎲 Real-time multiplayer gameplay
- 📱 Mobile-responsive with tap & drag controls
- 🤖 Computer player support
- 📊 Hidden scores (current round revealed next round)
- 👑 Admin session management

## Technology Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18 + TypeScript |
| Build Tool | Vite 5.3 |
| Routing | React Router DOM 6 |
| Authentication | Firebase Authentication (Google + Anonymous) |
| Database | Cloud Firestore |
| Realtime | Firebase Realtime Database (presence/heartbeat) |
| Hosting | Firebase Hosting |

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── DiceRoll.tsx      # Weather dice rolling animation
│   ├── GameBoard.tsx     # Main game board display
│   ├── Lobby.tsx         # Game lobby/joining screen
│   ├── PotPlacement.tsx   # Drag & tap pot/boat placement
│   ├── RoundResults.tsx   # Round outcome display
│   ├── Scoreboard.tsx     # Player scores display
│   └── RulesModal.tsx    # Game rules modal
├── contexts/             # React Context providers
│   ├── AuthContext.tsx   # Firebase auth handling
│   └── GameContext.tsx   # Game state management
├── pages/                 # Route pages
│   ├── AdminPage.tsx     # Admin creates/manages sessions
│   ├── HomePage.tsx      # Landing page (join/create game)
│   └── SessionPage.tsx   # Active game session view
├── utils/
│   └── game.ts           # Game logic utilities
├── styles/
│   └── main.css          # All styles including responsive
├── firebase.ts           # Firebase initialization
├── types.ts              # TypeScript interfaces
├── constants.ts          # Game constants
├── App.tsx               # Main app with routing
└── main.tsx              # Entry point
```

## Routes

| Path | Description |
|------|-------------|
| `/` | Home page - join or create a game session |
| `/admin` | Admin page - create/manage sessions (admin only) |
| `/session/:sessionId` | Active game session view |

## Environment Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Create a project** (or use existing)
3. Enter project name: `craypots`
4. Disable Google Analytics (optional)
5. Wait for project creation

### 2. Enable Authentication

1. In Firebase Console → **Build** → **Authentication**
2. Click **Get Started**
3. Go to **Sign-in method** tab
4. Enable **Google** provider
5. Enable **Anonymous** provider

### 3. Enable Cloud Firestore

1. In Firebase Console → **Build** → **Firestore Database**
2. Click **Create database**
3. Select location
4. Choose **Start in production mode**
5. Click **Create**

### 4. Enable Realtime Database

1. In Firebase Console → **Build** → **Realtime Database**
2. Click **Create database**
3. Select location
4. Choose **Start in locked mode**
5. Click **Create**

### 5. Create .env File

Copy `.env.example` to `.env` and fill in your Firebase config values.

## Installation & Running

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Deployment

```bash
# Deploy all (Firestore rules, DB rules, Hosting)
firebase deploy

# Or deploy individually
firebase deploy --only firestore:rules
firebase deploy --only database
firebase deploy --only hosting
```

## Game Rules

### Boats & Pots

| Element | Details |
|---------|---------|
| Starting boats | 3 per player (1 small, 1 medium, 1 large) |
| Starting pots | 9 total (2 Large, 3 Medium, 4 Small) |
| Pot capacities | Large: 10, Medium: 6, Small: 3 |

### Boat Pot Limits

| Boat Size | Max Pots | Max Large Pots |
|-----------|----------|----------------|
| Small | 2 | 0 |
| Medium | 3 | 0 |
| Large | 4 | 1 |

### Ocean Zones

| Zone | Multiplier | Storm Risk |
|------|------------|------------|
| Shallow | ×1 | No risk |
| Medium | ×2 | Mild: 15% pot loss |
| Deep | ×3 | Mild: 30% pot loss |

### Weather

| Weather | Effect |
|---------|--------|
| Calm (50%) | All pots return safely |
| Mild (33%) | Pots may be lost based on zone |
| Heavy (17%) | All pots lost, may lose a boat |

### Scoring

- Points = pot capacity × zone multiplier
- **Score shows previous rounds only** - current round hidden until next round
- At game end, all scores revealed

### Controls

- **Desktop**: Drag boats/pots to zones
- **Mobile**: Tap to select, tap zone to place

## Admin Access

Admin email: `your-admin-email@example.com` (change in `constants.ts`)

To grant admin access:
1. Sign in with Google at `/admin`
2. Verify your email in Firebase Console → Authentication → Users
3. Update `constants.ts` if using a different email

## License

MIT

## The game is hosted here

https://craypots-ab264.web.app/