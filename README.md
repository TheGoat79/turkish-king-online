# Turkish King Online

Online multiplayer Turkish King card game.

## Stack
- Node.js
- Express
- Socket.IO
- HTML/CSS/JavaScript

## Run

```bash
npm install
npm start
```

Open http://localhost:3000

## How to play

1. Enter a name and click **Create Room** (or paste a code and **Join Room**).
2. Share the room code so 4 players total join the same room.
3. Click **Start Game** — each player is dealt 13 cards.
4. On your turn, click a card to play it. You must follow the led suit when you can.
5. The highest card of the led suit wins the trick and leads the next one.
6. After all 13 tricks, each trick taken scores a point and the round ends.

## Gameplay features
- Real trick-taking: follow-suit enforcement and trick-winner resolution.
- Live turn indicator, current-trick view, and a dynamic scoreboard.
- Named players seated around the table (you always sit south).
- Disconnect handling: if a player leaves mid-game, the room resets.

> Note: scoring is a simplified "one point per trick" model. The full Turkish
> King (Kral) contract/penalty ruleset is not yet implemented.
