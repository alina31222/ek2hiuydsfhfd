# Mario Canvas Game

A 2D platformer inspired by Super Mario Bros, built with HTML5 Canvas and vanilla JavaScript.

## Features

- **Full-screen canvas** — responsive to window resize, level rebuilt automatically
- **Extended level** — 5000px wide with 6 pits and 7 floating platforms
- **Two-tier ground** — top tier with pit gaps, continuous bottom tier
- **Camera** — follows the player, clamped to level bounds
- **Player physics** — movement, variable-height jump (hold to jump higher), gravity, collision
- **SMB-style blocks** — brick, question block (animated glow), empty, ground; blocks bounce when hit from below
- **Question blocks** — 40% coin, 40% enemy, 20% mushroom (exclusive, one per block hit)
- **Coins** — pop from blocks, rise then fall, expire after 25 frames, +100 points
- **Enemies (Goombas)** — patrol with edge detection, gravity, stomp-kill (+200), flips by direction, vertical bob animation
- **Spawned enemies** — pop up from question blocks, walk off platforms (no edge detection), gain edge detection on ground
- **Mushrooms** — pop up from question blocks, move like enemies, harmless, +1000 points on touch
- **Pits** — fall below screen triggers death animation
- **Death animation** — Mario flies up then falls; on landing below screen shows Game Over
- **Game Over screen** — shows score and coins, press R to restart
- **Victory** — stand near flag pole for 2 seconds to win; shows final score, coins, time
- **Timer** — counts down from 500; at 0 → death
- **HUD** — right-aligned: `MARIO  score  COINS  count  TIME  timer`
- **SMB-style background** — pixel-art clouds, 3-layer green hills, green bushes at fixed world positions
- **Sprites** — loaded from `sprites/` folder with per-sprite fallback to colored shapes
- **Floating score texts** — fade out over 35 frames

## Controls

| Key | Action |
|-----|--------|
| ← → | Move left / right |
| ↑ / Space | Jump (hold for higher) |
| R | Restart (on Game Over or Victory screen) |

## Sprites

Place sprite files in the `sprites/` folder:

| File | Description |
|------|-------------|
| `brick.png` | Brick block |
| `qblock.png` | Question block |
| `empty.png` | Used question block |
| `coin.png` | Coin |
| `ground.png` | Ground block |
| `mario.png` | Mario idle |
| `mariojump.png` | Mario jumping |
| `mariowalk.png` | Mario walking (first frame) |
| `mariodeath.png` | Mario death pose |
| `goomba.png` | Goomba enemy |
| `pole.png` | Flag pole |
| `mushroom.png` | Super mushroom |

If a sprite fails to load, the game renders a colored rectangle as fallback.

## Files

- `index.html` — HTML shell with full-screen canvas
- `game.js` — all game logic (physics, rendering, state, HUD)
- `README.md` — this file

## How to Run

Serve the directory with any HTTP server (sprites are loaded via `Image` and require HTTP):

```bash
python -m http.server 8080
```

Then open `http://localhost:8080` in a browser.

## Development

Built as a learning project with vanilla JavaScript — no frameworks or dependencies.
