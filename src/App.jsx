
import { useState } from 'react';
import Game from './Game.jsx';
import ThemePage from './ThemePage.jsx';

function getPlayerId() {
  let id = localStorage.getItem('purse-chess-id');

  if (!id) {
    id =
      globalThis.crypto?.randomUUID?.() ||
      Math.random().toString(36).slice(2) + Date.now().toString(36);

    localStorage.setItem('purse-chess-id', id);
  }

  return id;
}

const randomCode = () =>
  Math.random().toString(36).slice(2, 7).toUpperCase();

export default function App() {
  const [room, setRoom] = useState(
    location.hash.slice(1).toUpperCase()
  );
  const [code, setCode] = useState('');
  const [theme, setTheme] = useState(
    localStorage.getItem('purse-chess-theme') || 'bag'
  );
  const [step, setStep] = useState(
    location.hash.slice(1) ? 'theme' : 'lobby'
  );

  const playerId = getPlayerId();

  function enterRoom(roomCode) {
    const nextRoom = roomCode.trim().toUpperCase();

    if (!nextRoom) return;

    location.hash = nextRoom;
    setRoom(nextRoom);
    setStep('theme');
  }

  function changeTheme(nextTheme) {
    setTheme(nextTheme);
    localStorage.setItem('purse-chess-theme', nextTheme);
  }

  function leaveGame() {
    history.replaceState(
      null,
      '',
      location.pathname + location.search
    );

    setRoom('');
    setStep('lobby');
  }

  if (step === 'theme') {
    return (
      <ThemePage
        value={theme}
        onChange={changeTheme}
        onBack={() => setStep('lobby')}
        onContinue={() => setStep('game')}
        room={room}
      />
    );
  }

  if (step === 'game') {
    return (
      <Game
        key={room}
        room={room}
        playerId={playerId}
        theme={theme}
        onLeave={leaveGame}
        onChangeTheme={() => setStep('theme')}
      />
    );
  }

  return (
    <div className="table">
      <div className="lobby">
        <h1>Everywhere Chess</h1>
        <p>What's Today's Vibe?</p>
        <p>Same rules, endless themes. Play chess your way.</p>

        <button
          className="btn primary"
          onClick={() => enterRoom(randomCode())}
        >
          Create a Room
        </button>

        <div className="or">OR</div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            enterRoom(code);
          }}
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter room code"
            maxLength={12}
            required
          />

          <button className="btn" type="submit">
            Join a Room
          </button>
        </form>
      </div>
    </div>
  );
}
