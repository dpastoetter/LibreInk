/**
 * Minimal Mario-style side-scroller. Discrete tick only (no requestAnimationFrame)
 * for e-ink/Kindle. Touch-friendly buttons. Inspired by classic run/jump/platform gameplay.
 */
import { useState, useCallback, useEffect, useRef } from 'preact/hooks';

const BLOCK = 20; // px per block; large enough for e-ink
const WORLD_W = 24;
const WORLD_H = 8;
const GROUND_Y = WORLD_H - 1;
/** Tick interval (ms). Slower = more Kindle-friendly. */
const TICK_MS = 200;
const GRAVITY = 1;
const JUMP_VY = -4;
const MOVE_SPEED = 1;

interface Platform {
  x: number;
  y: number;
  w: number;
}

interface Enemy {
  x: number;
  y: number;
}

interface Coin {
  x: number;
  y: number;
}

const PLATFORMS: Platform[] = [
  { x: 4, y: 5, w: 3 },
  { x: 10, y: 4, w: 3 },
  { x: 16, y: 5, w: 2 },
];

function initialCoins(): Coin[] {
  return [
    { x: 6, y: 4 },
    { x: 12, y: 3 },
    { x: 18, y: 4 },
  ];
}

function onPlatform(px: number, py: number): boolean {
  if (py >= GROUND_Y) return true;
  for (const p of PLATFORMS) {
    if (py + 1 === p.y && px >= p.x && px < p.x + p.w) return true;
  }
  return false;
}

function overlap(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
  return Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1;
}

interface GameState {
  playerX: number;
  playerY: number;
  vy: number;
  enemies: Enemy[];
  coins: Coin[];
  score: number;
  gameOver: boolean;
}

function tick(
  state: GameState,
  moveDir: number,
  jumpPressed: boolean
): GameState {
  if (state.gameOver) return state;
  let { playerX, playerY, vy, enemies, coins, score } = state;

  // Horizontal move
  playerX = Math.max(0, Math.min(WORLD_W - 1, playerX + moveDir * MOVE_SPEED));

  // Jump only when on ground/platform
  if (jumpPressed && onPlatform(playerX, playerY)) vy = JUMP_VY;
  else if (!onPlatform(playerX, playerY)) vy = vy + GRAVITY;

  // Vertical: apply vy (y increases downward)
  const nextY = playerY + vy;
  if (nextY >= GROUND_Y) {
    playerY = GROUND_Y;
    vy = 0;
  } else {
    let landed = false;
    for (const p of PLATFORMS) {
      if (playerY < p.y && nextY >= p.y && playerX >= p.x && playerX < p.x + p.w) {
        playerY = p.y - 1;
        vy = 0;
        landed = true;
        break;
      }
    }
    if (!landed) {
      playerY = nextY;
    }
  }

  // Enemies move left
  enemies = enemies.map((e) => {
    let nx = e.x - 1;
    if (nx < 0) nx = WORLD_W - 1;
    return { ...e, x: nx };
  });

  // Coin collection
  const stillCoins = coins.filter((c) => !(playerX === c.x && playerY === c.y));
  const collected = coins.length - stillCoins.length;
  score += collected;
  coins = stillCoins;

  // Enemy collision
  const hit = enemies.some((e) => overlap(e, { x: playerX, y: playerY }));

  return {
    playerX,
    playerY,
    vy,
    enemies,
    coins,
    score,
    gameOver: hit,
  };
}

const INITIAL_STATE: GameState = {
  playerX: 2,
  playerY: GROUND_Y,
  vy: 0,
  enemies: [
    { x: 14, y: GROUND_Y },
    { x: 20, y: GROUND_Y },
  ],
  coins: initialCoins(),
  score: 0,
  gameOver: false,
};

export function MarioGame() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [playing, setPlaying] = useState(false);
  const moveDirRef = useRef(0);
  const jumpPressedRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startGame = useCallback(() => {
    setState({
      ...INITIAL_STATE,
      enemies: [
        { x: 14, y: GROUND_Y },
        { x: 20, y: GROUND_Y },
      ],
      coins: initialCoins(),
    });
    setPlaying(true);
    moveDirRef.current = 0;
    jumpPressedRef.current = false;
  }, []);

  useEffect(() => {
    if (!playing || state.gameOver) return;
    tickRef.current = setInterval(() => {
      setState((s) => tick(s, moveDirRef.current, jumpPressedRef.current));
      jumpPressedRef.current = false; // one tick per jump press (Kindle tap-friendly)
    }, TICK_MS);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [playing, state.gameOver]);

  useEffect(() => {
    if (state.gameOver && tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, [state.gameOver]);

  // Keyboard: arrows + Space (desktop)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!playing || state.gameOver) return;
      if (e.key === 'ArrowLeft') moveDirRef.current = -1;
      if (e.key === 'ArrowRight') moveDirRef.current = 1;
      if (e.key === ' ') {
        e.preventDefault();
        jumpPressedRef.current = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && moveDirRef.current === -1) moveDirRef.current = 0;
      if (e.key === 'ArrowRight' && moveDirRef.current === 1) moveDirRef.current = 0;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [playing, state.gameOver]);

  if (!playing) {
    return (
      <div class="mario-game">
        <p class="mario-intro">
          Run, jump, collect coins. Avoid enemies. Discrete ticks — e-ink / Kindle friendly.
        </p>
        <p class="mario-meta">Use Left / Right / Jump buttons. Keyboard: arrows + Space.</p>
        <button type="button" class="btn" onClick={startGame}>
          Start game
        </button>
      </div>
    );
  }

  const { playerX, playerY, enemies, coins, score, gameOver } = state;

  return (
    <div class="mario-game">
      <p class="mario-score" aria-live="polite">
        Score: {score} {gameOver ? '— Game over' : ''}
      </p>
      <div
        class="mario-world"
        role="img"
        aria-label={`Mario game. Player at ${playerX}, ${playerY}. ${enemies.length} enemies.`}
        style={{ width: WORLD_W * BLOCK, height: WORLD_H * BLOCK }}
      >
        <div
          class="mario-ground"
          style={{
            left: 0,
            top: GROUND_Y * BLOCK,
            width: WORLD_W * BLOCK,
            height: BLOCK,
          }}
        />
        {PLATFORMS.map((p, i) => (
          <div
            key={i}
            class="mario-platform"
            style={{
              left: p.x * BLOCK,
              top: p.y * BLOCK,
              width: p.w * BLOCK,
              height: BLOCK,
            }}
          />
        ))}
        {coins.map((c, i) => (
          <div
            key={`c-${i}`}
            class="mario-coin"
            style={{ left: c.x * BLOCK, top: c.y * BLOCK, width: BLOCK, height: BLOCK }}
          />
        ))}
        {enemies.map((e, i) => (
          <div
            key={`e-${i}`}
            class="mario-enemy"
            style={{ left: e.x * BLOCK, top: e.y * BLOCK, width: BLOCK, height: BLOCK }}
          />
        ))}
        <div
          class="mario-player"
          style={{
            left: playerX * BLOCK,
            top: playerY * BLOCK,
            width: BLOCK,
            height: BLOCK,
          }}
        />
      </div>
      <div class="mario-controls">
        <button
          type="button"
          class="btn mario-btn"
          onMouseDown={() => (moveDirRef.current = -1)}
          onMouseUp={() => (moveDirRef.current = 0)}
          onMouseLeave={() => (moveDirRef.current = 0)}
          onTouchStart={(e) => {
            e.preventDefault();
            moveDirRef.current = -1;
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            moveDirRef.current = 0;
          }}
          disabled={gameOver}
          aria-label="Move left"
        >
          ← Left
        </button>
        <button
          type="button"
          class="btn mario-btn mario-jump"
          onMouseDown={() => (jumpPressedRef.current = true)}
          onMouseUp={() => (jumpPressedRef.current = false)}
          onMouseLeave={() => (jumpPressedRef.current = false)}
          onTouchStart={(e) => {
            e.preventDefault();
            jumpPressedRef.current = true;
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            jumpPressedRef.current = false;
          }}
          disabled={gameOver}
          aria-label="Jump"
        >
          Jump
        </button>
        <button
          type="button"
          class="btn mario-btn"
          onMouseDown={() => (moveDirRef.current = 1)}
          onMouseUp={() => (moveDirRef.current = 0)}
          onMouseLeave={() => (moveDirRef.current = 0)}
          onTouchStart={(e) => {
            e.preventDefault();
            moveDirRef.current = 1;
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            moveDirRef.current = 0;
          }}
          disabled={gameOver}
          aria-label="Move right"
        >
          Right →
        </button>
      </div>
      {gameOver && (
        <button type="button" class="btn" onClick={startGame}>
          Play again
        </button>
      )}
    </div>
  );
}
