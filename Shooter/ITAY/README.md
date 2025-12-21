# Shooter - Multiplayer Combat Arena

A complete multiplayer 2D minimalist shooter game with Firebase backend.

## Features

✅ **Authentication**
- Google Sign-In
- Guest Mode
- Persistent 6-digit user IDs

✅ **Multiplayer Lobby**
- Create rooms with 6-digit codes
- Join rooms by code
- Up to 4 players per match
- Ready system
- 5-second dramatic countdown

✅ **Core Gameplay**
- Arrow key movement (left/right + jump)
- Space bar shooting
- 3 enemy types (Red/Yellow/Blue) with different damages and spawn rates
- Real-time multiplayer sync
- Health bars and scoring
- Host-authoritative enemy spawning with deterministic seeds

✅ **Progression Systems**
- Shop for cosmetics
- Currency system
- User stats tracking
- Missions (placeholder)
- Upgrades (placeholder)
- Friends system (placeholder)

✅ **Audio**
- Sound effects for shooting, hits, countdown
- Web Audio API generated sounds

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Backend**: Firebase
  - Authentication (Google + Anonymous)
  - Firestore (user profiles, stats, upgrades)
  - Realtime Database (game state, multiplayer sync)
- **Design**: Modern CSS with glassmorphism, gradients, and animations

## Setup

1. **Firebase is already configured** with the provided credentials
2. **Run a local server**:
   ```bash
   npx -y http-server . -p 8080
   ```
3. **Open**: http://localhost:8080

## Game Controls

- **Arrow Left/Right**: Move
- **Arrow Up**: Jump
- **Space**: Shoot
- **ESC**: Pause (during game)

## Project Structure

```
Shooter/
├── index.html
├── styles/
│   ├── main.css (design system)
│   ├── auth.css
│   ├── home.css
│   ├── lobby.css
│   ├── game.css
│   └── screens.css
├── src/
│   ├── firebase/
│   │   ├── config.js (Firebase init)
│   │   ├── auth.js (authentication)
│   │   ├── firestore.js (user data)
│   │   └── realtime.js (game state)
│   ├── game/
│   │   ├── Game.js (main game loop)
│   │   ├── Player.js
│   │   ├── Enemy.js
│   │   ├── Bullet.js
│   │   ├── spawner.js
│   │   └── collision.js
│   ├── ui/
│   │   ├── authScreen.js
│   │   ├── homeScreen.js
│   │   ├── lobbyScreen.js
│   │   ├── gameScreen.js
│   │   ├── endScreen.js
│   │   ├── shopScreen.js
│   │   └── ... (other screens)
│   ├── audio/
│   │   └── audioManager.js
│   ├── utils/
│   │   ├── helpers.js
│   │   ├── validators.js
│   │   └── idGenerator.js
│   ├── config.js
│   └── main.js (app entry point)
└── README.md
```

## How to Play

1. **Sign In**: Use Google or continue as guest
2. **Home**: View your 6-digit user ID
3. **Create/Join**: 
   - Click "Play Online" to auto-create
   - Or "Create / Join by ID" for manual room management
4. **Lobby**: 
   - Share your room code with friends
   - All players click "Ready"
   - Host clicks "Start Game"
5. **Game**: 
   - Shoot falling enemies
   - Avoid getting hit
   - Higher scores for rarer enemies
6. **Shop**: Spend earned currency on cosmetics

## Enemy Types

- **Red**: 10 damage, 5 score, high frequency
- **Yellow**: 15 damage, 10 score, medium frequency
- **Blue**: 30 damage, 20 score, rare

## Firebase Data Schema

### Firestore: `/users/{uid}`
```json
{
  "userCode": "123456",
  "displayName": "Player Name",
  "authType": "google|guest",
  "stats": {
    "totalKills": 0,
    "totalScore": 0,
    "gamesPlayed": 0
  },
  "currency": 0,
  "cosmeticsOwned": ["default"],
  "selectedCosmetic": "default",
  "upgrades": {
    "fireRateLevel": 0,
    "damageLevel": 0,
    "hpLevel": 0,
    "speedLevel": 0
  },
  "friends": [],
  "missions": {}
}
```

### Realtime DB: `/rooms/{roomCode}`
```json
{
  "hostUid": "...",
  "status": "lobby|countdown|playing|ended",
  "matchSeed": 123456,
  "teamScore": 0,
  "countdown": 5,
  "players": {
    "uid": {
      "userCode": "123456",
      "displayName": "...",
      "ready": false,
      "hp": 100,
      "score": 0,
      "x": 0,
      "y": 0,
      "kills": {"red": 0, "yellow": 0, "blue": 0} 
```}
}
}
```

## Development Status

✅ Core functionality complete
⚠️ Some progression screens are placeholders (Upgrades Tree, Friends, Missions)
🔄 Future enhancements: volume controls, advanced anti-cheat, full missions system

## Credits

Built with ❤️ for KIC-start project
