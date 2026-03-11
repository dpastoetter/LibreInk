import { useState, useCallback, useEffect, useContext } from 'preact/hooks';
import { boardToFen, getStockfishMove, isStockfishAvailable } from './stockfish-worker';
import { AppHeaderActionsContext } from '@core/kernel/AppHeaderActionsContext';

type Piece = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P' | 'k' | 'q' | 'r' | 'b' | 'n' | 'p' | null;
type Board = (Piece)[][];

function copyBoard(b: Board): Board {
  return b.map((row) => [...row]);
}

function findKing(board: Board, color: 'w' | 'b'): [number, number] | null {
  const king = color === 'w' ? 'K' : 'k';
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (board[r][c] === king) return [r, c];
  return null;
}

function isSquareAttacked(board: Board, row: number, col: number, byColor: 'w' | 'b'): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || isWhite(piece) !== (byColor === 'w')) continue;
      const moves = getMoves(board, r, c);
      if (moves.some(([mr, mc]) => mr === row && mc === col)) return true;
    }
  }
  return false;
}

function isKingAttacked(board: Board, color: 'w' | 'b'): boolean {
  const k = findKing(board, color);
  if (!k) return false;
  return isSquareAttacked(board, k[0], k[1], color === 'w' ? 'b' : 'w');
}

function getLegalMoves(board: Board, row: number, col: number): [number, number][] {
  const piece = board[row][col];
  if (!piece) return [];
  const color: 'w' | 'b' = isWhite(piece) ? 'w' : 'b';
  const candidates = getMoves(board, row, col);
  const out: [number, number][] = [];
  for (const [toR, toC] of candidates) {
    const next = copyBoard(board);
    next[toR][toC] = piece;
    next[row][col] = null;
    if (!isKingAttacked(next, color)) out.push([toR, toC]);
  }
  return out;
}

const PIECE_VALUE: Record<string, number> = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0, p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

function materialScore(board: Board, forBlack: boolean): number {
  let score = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c];
    if (!p) continue;
    const v = PIECE_VALUE[p];
    if (isWhite(p)) score -= v; else score += v;
  }
  return forBlack ? score : -score;
}

function getComputerMove(board: Board): { from: [number, number]; to: [number, number] } | null {
  const moves: { from: [number, number]; to: [number, number]; score: number }[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || isWhite(piece)) continue;
      const legal = getLegalMoves(board, r, c);
      for (const [toR, toC] of legal) {
        const next = copyBoard(board);
        next[toR][toC] = piece;
        next[r][c] = null;
        const score = materialScore(next, true);
        moves.push({ from: [r, c], to: [toR, toC], score });
      }
    }
  }
  if (moves.length === 0) return null;
  let best = moves[0];
  for (const m of moves) if (m.score > best.score) best = m;
  const bestScore = best.score;
  const bestMoves = moves.filter((m) => m.score === bestScore);
  const pick = bestMoves[Math.floor(Math.random() * bestMoves.length)];
  return { from: pick.from, to: pick.to };
}

function initialBoard(): Board {
  const b: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  const back = (row: number, color: 'w' | 'b') => {
    b[row][0] = ((color === 'w' ? 'R' : 'r') as Piece);
    b[row][1] = ((color === 'w' ? 'N' : 'n') as Piece);
    b[row][2] = ((color === 'w' ? 'B' : 'b') as Piece);
    b[row][3] = ((color === 'w' ? 'Q' : 'q') as Piece);
    b[row][4] = ((color === 'w' ? 'K' : 'k') as Piece);
    b[row][5] = ((color === 'w' ? 'B' : 'b') as Piece);
    b[row][6] = ((color === 'w' ? 'N' : 'n') as Piece);
    b[row][7] = ((color === 'w' ? 'R' : 'r') as Piece);
  };
  back(0, 'b');
  back(7, 'w');
  for (let c = 0; c < 8; c++) {
    b[1][c] = 'p';
    b[6][c] = 'P';
  }
  return b;
}

function isWhite(p: Piece): boolean {
  return p !== null && p === p.toUpperCase();
}

function getMoves(board: Board, row: number, col: number): [number, number][] {
  const piece = board[row][col];
  if (!piece) return [];
  const white = isWhite(piece);
  const out: [number, number][] = [];

  const canMove = (r: number, c: number): boolean => {
    if (r < 0 || r >= 8 || c < 0 || c >= 8) return false;
    const target = board[r][c];
    if (!target) return true;
    return isWhite(target) !== white;
  };

  const add = (r: number, c: number) => {
    if (canMove(r, c)) out.push([r, c]);
  };

  const p = piece.toLowerCase();
  if (p === 'p') {
    const dir = white ? -1 : 1;
    add(row + dir, col);
    if ((white && row === 6) || (!white && row === 1)) add(row + 2 * dir, col);
    if (board[row + dir]?.[col - 1] && isWhite(board[row + dir][col - 1]!) !== white) add(row + dir, col - 1);
    if (board[row + dir]?.[col + 1] && isWhite(board[row + dir][col + 1]!) !== white) add(row + dir, col + 1);
  } else if (p === 'r') {
    for (let r = row - 1; r >= 0 && !board[r][col]; r--) add(r, col);
    for (let r = row + 1; r < 8 && !board[r][col]; r++) add(r, col);
    for (let c = col - 1; c >= 0 && !board[row][c]; c--) add(row, c);
    for (let c = col + 1; c < 8 && !board[row][c]; c++) add(row, c);
  } else if (p === 'b') {
    for (let d = 1; row - d >= 0 && col - d >= 0; d++) { add(row - d, col - d); if (board[row - d][col - d]) break; }
    for (let d = 1; row + d < 8 && col + d < 8; d++) { add(row + d, col + d); if (board[row + d][col + d]) break; }
    for (let d = 1; row - d >= 0 && col + d < 8; d++) { add(row - d, col + d); if (board[row - d][col + d]) break; }
    for (let d = 1; row + d < 8 && col - d >= 0; d++) { add(row + d, col - d); if (board[row + d][col - d]) break; }
  } else if (p === 'q') {
    for (let r = row - 1; r >= 0 && !board[r][col]; r--) add(r, col);
    for (let r = row + 1; r < 8 && !board[r][col]; r++) add(r, col);
    for (let c = col - 1; c >= 0 && !board[row][c]; c--) add(row, c);
    for (let c = col + 1; c < 8 && !board[row][c]; c++) add(row, c);
    for (let d = 1; row - d >= 0 && col - d >= 0; d++) { add(row - d, col - d); if (board[row - d][col - d]) break; }
    for (let d = 1; row + d < 8 && col + d < 8; d++) { add(row + d, col + d); if (board[row + d][col + d]) break; }
    for (let d = 1; row - d >= 0 && col + d < 8; d++) { add(row - d, col + d); if (board[row - d][col + d]) break; }
    for (let d = 1; row + d < 8 && col - d >= 0; d++) { add(row + d, col - d); if (board[row + d][col - d]) break; }
  } else if (p === 'k') {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr || dc) add(row + dr, col + dc);
  } else if (p === 'n') {
    const jumps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    jumps.forEach(([dr, dc]) => add(row + dr, col + dc));
  }
  return out;
}

type GameMode = '2p' | 'vsComputer' | null;

const isLegacy = typeof import.meta.env.LEGACY !== 'undefined' && import.meta.env.LEGACY;
const CHESS_BOARD_MIN = 240;
const CHESS_BOARD_MAX = 480;
const CHESS_BOARD_STEP = 40;
const CHESS_BOARD_DEFAULT = 320;

const STOCKFISH_LEVEL_MIN = 1;
const STOCKFISH_LEVEL_MAX = 20;
const STOCKFISH_LEVEL_DEFAULT = 10;
const STOCKFISH_MOVETIME_MS = 1500;

export function ChessGame() {
  const [mode, setMode] = useState<GameMode>(null);
  const [board, setBoard] = useState<Board>(initialBoard);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [moves, setMoves] = useState<[number, number][]>([]);
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [computerThinking, setComputerThinking] = useState(false);
  const [boardSizePx, setBoardSizePx] = useState(CHESS_BOARD_DEFAULT);
  const [engineLevel, setEngineLevel] = useState(STOCKFISH_LEVEL_DEFAULT);

  const applyMove = useCallback((fromR: number, fromC: number, toR: number, toC: number) => {
    const next = copyBoard(board);
    const piece = next[fromR][fromC];
    if (!piece) return next;
    next[toR][toC] = piece;
    next[fromR][fromC] = null;
    return next;
  }, [board]);

  const moveTo = useCallback((toRow: number, toCol: number) => {
    if (!selected) return;
    const [sr, sc] = selected;
    const piece = board[sr][sc];
    if (!piece) return;
    const white = isWhite(piece);
    if ((turn === 'w' && !white) || (turn === 'b' && white)) return;
    const allowed = getLegalMoves(board, sr, sc);
    if (!allowed.some(([r, c]) => r === toRow && c === toCol)) return;
    const next = applyMove(sr, sc, toRow, toCol);
    setBoard(next);
    setSelected(null);
    setMoves([]);
    setTurn(turn === 'w' ? 'b' : 'w');
  }, [board, selected, turn, applyMove]);

  useEffect(() => {
    if (mode !== 'vsComputer' || turn !== 'b' || computerThinking) return;
    setComputerThinking(true);
    const useStockfish = !isLegacy && isStockfishAvailable();
    if (useStockfish) {
      getStockfishMove(
        boardToFen(board, 'b'),
        engineLevel,
        STOCKFISH_MOVETIME_MS,
        ([fromR, fromC], [toR, toC]) => {
          setBoard((prev) => {
            const next = copyBoard(prev);
            const piece = next[fromR][fromC];
            if (piece) {
              next[toR][toC] = piece;
              next[fromR][fromC] = null;
            }
            return next;
          });
          setTurn('w');
          setComputerThinking(false);
        },
        () => {
          setComputerThinking(false);
          setTurn('w');
        }
      );
      return;
    }
    /* Fallback: simple engine with 400ms delay — e-ink / legacy friendly. */
    const timer = setTimeout(() => {
      const comp = getComputerMove(board);
      if (comp) {
        const next = copyBoard(board);
        const piece = next[comp.from[0]][comp.from[1]];
        if (piece) {
          next[comp.to[0]][comp.to[1]] = piece;
          next[comp.from[0]][comp.from[1]] = null;
          setBoard(next);
        }
        setTurn('w');
      }
      setComputerThinking(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [mode, turn, board, engineLevel]);

  const onCell = (row: number, col: number) => {
    if (mode === 'vsComputer' && turn === 'b') return;
    if (selected) {
      const [sr, sc] = selected;
      if (sr === row && sc === col) {
        setSelected(null);
        setMoves([]);
        return;
      }
      if (moves.some(([r, c]) => r === row && c === col)) {
        moveTo(row, col);
        return;
      }
      const piece = board[row][col];
      if (piece && isWhite(piece) === (turn === 'w')) {
        setSelected([row, col]);
        setMoves(getLegalMoves(board, row, col));
      }
      return;
    }
    const piece = board[row][col];
    if (piece && isWhite(piece) === (turn === 'w')) {
      setSelected([row, col]);
      setMoves(getLegalMoves(board, row, col));
    }
  };

  const startGame = (m: GameMode) => {
    setMode(m);
    setBoard(initialBoard());
    setTurn('w');
    setSelected(null);
    setMoves([]);
    setComputerThinking(false);
  };

  const symbols: Record<string, string> = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙', k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };

  if (mode === null) {
    return (
      <div class="chess-game chess-mode-select">
        <p class="chess-turn">Choose mode</p>
        <div class="chess-mode-buttons">
          <button type="button" class="btn" onClick={() => startGame('2p')}>Two players</button>
          <button type="button" class="btn" onClick={() => startGame('vsComputer')}>vs Computer</button>
        </div>
        <div class="chess-engine-level" role="group" aria-label="Engine level">
          <label for="chess-level">Engine level</label>
          <select
            id="chess-level"
            class="chess-level-select"
            value={engineLevel}
            onChange={(e) => setEngineLevel(Number((e.target as HTMLSelectElement).value))}
            aria-describedby="chess-level-hint"
          >
            {Array.from({ length: STOCKFISH_LEVEL_MAX - STOCKFISH_LEVEL_MIN + 1 }, (_, i) => i + STOCKFISH_LEVEL_MIN).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span id="chess-level-hint" class="chess-level-hint">
            {isLegacy ? '1–20 (simple engine on this device)' : '1 = easiest, 20 = strongest'}
          </span>
        </div>
      </div>
    );
  }

  const setHeaderActions = useContext(AppHeaderActionsContext);
  useEffect(() => {
    if (!setHeaderActions) return;
    if (mode === null) {
      setHeaderActions(null);
      return () => setHeaderActions(null);
    }
    const node = (
      <div class="chess-board-zoom" role="group" aria-label="Board size">
        <button type="button" class="btn btn-status btn-status-zoom" onClick={() => setBoardSizePx((s) => Math.max(CHESS_BOARD_MIN, s - CHESS_BOARD_STEP))} aria-label="Smaller board">−</button>
        <span class="chess-board-zoom-label">{boardSizePx}px</span>
        <button type="button" class="btn btn-status btn-status-zoom" onClick={() => setBoardSizePx((s) => Math.min(CHESS_BOARD_MAX, s + CHESS_BOARD_STEP))} aria-label="Larger board">+</button>
      </div>
    );
    setHeaderActions(node);
    return () => setHeaderActions(null);
  }, [setHeaderActions, mode, boardSizePx]);

  const boardStyle = { width: boardSizePx + 'px', height: boardSizePx + 'px' };

  return (
    <div class="chess-game">
      <div class="chess-board" style={boardStyle}>
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isSel = selected?.[0] === r && selected?.[1] === c;
            const isMove = moves.some(([mr, mc]) => mr === r && mc === c);
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                class={`chess-cell ${(r + c) % 2 === 0 ? 'chess-light' : 'chess-dark'} ${isSel ? 'chess-selected' : ''} ${isMove ? 'chess-move' : ''}`}
                onClick={() => onCell(r, c)}
                aria-label={`${cell ? (symbols[cell] ?? cell) : 'empty'} row ${r + 1} col ${c + 1}`}
              >
                {cell ? (symbols[cell] ?? cell) : ''}
              </button>
            );
          })
        )}
      </div>
      <div class="chess-footer">
        <p class="chess-turn">
          {mode === 'vsComputer' ? (turn === 'w' ? 'Your turn (White)' : computerThinking ? 'Computer thinking…' : 'Computer (Black)') : `Turn: ${turn === 'w' ? 'White' : 'Black'}`}
        </p>
        <button type="button" class="btn" onClick={() => setMode(null)}>New game</button>
      </div>
    </div>
  );
}
