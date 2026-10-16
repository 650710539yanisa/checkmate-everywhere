import { useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { socket } from './socket.js';
import Board from './Board.jsx';
import { PIECES } from './pieces.js';

const SIDE = { w: 'White', b: 'Black' };
const GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };

export default function Game({
  room,
  playerId,
  theme,
  onLeave,
  onChangeTheme,
}) {
  const [color, setColor] = useState(undefined); // undefined = connecting, null = spectator
  const [state, setState] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const join = () =>
      socket.emit('join', { room, playerId }, (res) => {
        if (res?.error) setError("Couldn't join the room");
        else setColor(res.color);
      });
    const onState = (s) => {
      setState(s);
      setSelected(null);
    };
    socket.on('state', onState);
    socket.on('connect', join);
    if (socket.connected) join();
    return () => {
      socket.off('state', onState);
      socket.off('connect', join);
    };
  }, [room, playerId]);

  const chess = useMemo(() => (state ? new Chess(state.fen) : null), [state]);

  const targets =
    selected && chess
      ? chess.moves({ square: selected, verbose: true }).map((m) => m.to)
      : [];

  const myTurn =
    state && color && state.status === 'playing' && state.turn === color;

  function flash(msg) {
    setError(msg);
    setTimeout(() => setError(''), 2000);
  }

  function onSquare(sq) {
    if (!myTurn) return;
    if (selected && targets.includes(sq)) {
      socket.emit('move', { from: selected, to: sq }, (res) => {
        if (res?.error) flash(res.error);
      });
      setSelected(null);
      return;
    }
    const p = chess.get(sq);
    setSelected(p && p.color === color ? sq : null);
  }

  function copyLink() {
    navigator.clipboard?.writeText(`${location.origin}/#${room}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!state)
    return (
      <div className="table">
        <div className="lobby">{error || 'Connecting…'}</div>
      </div>
    );

  const last = state.history[state.history.length - 1];
  const waiting = !state.online.w || !state.online.b;
  const over = state.status !== 'playing';

  let message;
  if (state.status === 'checkmate' || state.status === 'resigned')
    message = `🏆 ${SIDE[state.winner]} wins${
      state.status === 'resigned' ? ' (opponent resigned)' : ''
    }`;
  else if (state.status === 'stalemate') message = '🤝 Draw (stalemate)';
  else if (state.status === 'draw') message = '🤝 Draw';
  else if (waiting && color) message = 'Waiting for your friend… copy the link and send it';
  else if (color === null) message = `Spectating · ${SIDE[state.turn]} to move`;
  else if (state.turn === color)
    message = state.inCheck ? 'Your turn – you are in check! ⚠️' : 'Your turn';
  else message = `Waiting for ${SIDE[state.turn]} to move…`;

  // pieces each side has lost
  const taken = { w: [], b: [] };
  state.history.forEach((m) => {
    if (m.captured) taken[m.color === 'w' ? 'b' : 'w'].push(m.captured);
  });

  const me = color || 'w';
  const opp = me === 'w' ? 'b' : 'w';

   const Tray = ({ side }) => (
    <div className="tray">
      <span className="tray-name">{SIDE[side]}</span>
      <span className={`dot ${state.online[side] ? 'on' : ''}`} />
      <span className="lost">
        {taken[side].map((t, i) => (
          <span key={i}>
            {/* 👇 แก้บรรทัดนี้ครับ เพิ่ม || theme === 'bistro' เข้าไป */}
            {theme === 'classic' || theme === 'bistro' 
              ? GLYPH[t] + '\uFE0E' 
              : PIECES[side][t].icon}
          </span>
        ))}
      </span>
    </div>
  );

  return (
    <div className="table">
      <div className="game">
        <header className="topbar">
          <button className="btn small" onClick={onLeave}>← Leave</button>
          <div className="room">Room <b>{room}</b></div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn small" onClick={onChangeTheme}>Theme</button>
            <button className="btn small" onClick={copyLink}>
              {copied ? 'Copied ✓' : '🔗 Copy link'}
            </button>
          </div>
        </header>

        <Tray side={opp} />

        <Board
          fen={state.fen}
          orientation={me}
          selected={selected}
          targets={targets}
          lastMove={last}
          onSquare={onSquare}
          theme={theme}
        />

        <Tray side={me} />

        <div className={`status ${over ? 'over' : ''}`}>{error || message}</div>

        {color && (
          <div className="actions">
            {!over && (
              <button
                className="btn"
                onClick={() => confirm('Really resign?') && socket.emit('resign')}
              >
                🏳️ Resign
              </button>
            )}
            {over && (
              <button className="btn primary" onClick={() => socket.emit('rematch')}>
                🔄 Rematch
              </button>
            )}
          </div>
        )}

        <div className="moves">
          {state.history.map((m, i) => (
            <span key={i} className={m.color}>
              {i % 2 === 0 && <em>{i / 2 + 1}.</em>} {m.san}
            </span>
          ))}
        </div>
      </div>
    </div>

    
  );
}

function Tray({ label, online, lost, color, theme }) {
  const bistroSet = '3d_wood'; // ให้ตรงกับใน Board.jsx

  return (
    <div className="tray">
      <span className={`dot ${online ? 'on' : ''}`} />
      <span className="tray-name">{label}</span>

      <span className="lost">
        {lost.map((t, i) =>
          theme === 'classic' ? (
            <span key={i}>{GLYPH[color][t]}</span>
          ) : theme === 'bistro' ? (
            <img
              key={i}
              className="piece-img"
              src={`https://images.chesscomfiles.com/chess-themes/pieces/${bistroSet}/150/${color}${t}.png`}
              alt={t}
            />
          ) : (
            <PieceIcon key={i} color={color} type={t} />
          )
        )}
      </span>
    </div>
  );
}