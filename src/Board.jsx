import { Chess } from 'chess.js';
import { PIECES } from './pieces.js';
import PieceIcon from './PieceIcon.jsx';

const GLYPH = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

export default function Board({
  fen,
  orientation,
  selected,
  targets,
  lastMove,
  onSquare,
  theme,
}) {
  const chess = new Chess(fen);
  const grid = chess.board();
  const turn = chess.turn();
  const inCheck = chess.inCheck();

  let squares = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      squares.push({
        sq: 'abcdefgh'[c] + (8 - r),
        piece: grid[r][c],
        light: (r + c) % 2 === 0,
        idx: r * 8 + c,
      });
    }
  }

  if (orientation === 'b') {
    squares = squares.reverse();
  }

  return (
    <div className={`board theme-${theme}`}>
      {squares.map(({ sq, piece, light, idx }) => {
        const cls = ['tile', light ? 'light' : 'dark'];

        if (sq === selected) cls.push('selected');
        if (lastMove && (sq === lastMove.from || sq === lastMove.to)) {
          cls.push('last');
        }
        if (inCheck && piece?.type === 'k' && piece.color === turn) {
          cls.push('check');
        }

        const isTarget = targets.includes(sq);
        if (isTarget) {
          cls.push(piece ? 'capture' : 'target');
        }

        // เอียงหมากเล็กน้อยในธีม In My Bag และ Bistro
        const tilt = ((idx * 37) % 13) - 6;

        return (
          <div
            key={sq}
            className={cls.join(' ')}
            onClick={() => onSquare(sq)}
          >
            {piece && (
              <span
                className={`piece ${piece.color} t-${piece.type}`}
                title={
                  theme === 'bag'
                    ? PIECES[piece.color][piece.type].name
                    : piece.type.toUpperCase()
                }
              >
                <span
                  className="piece-rot"
                  style={{
                    transform:
                      theme === 'classic'
                        ? 'none'
                        : `rotate(${tilt}deg)`,
                  }}
                >
                  {theme === 'classic' ? (
                    <span className="classic-piece">
                      {GLYPH[piece.color][piece.type]}
                    </span>
                  ) : (
                    <PieceIcon
                      color={piece.color}
                      type={piece.type}
                      theme={theme}
                    />
                  )}
                </span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}