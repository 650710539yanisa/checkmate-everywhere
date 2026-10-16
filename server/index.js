import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { Chess } from 'chess.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const rooms = new Map();

function getRoom(id) {
  if (!rooms.has(id)) {
    rooms.set(id, {
      chess: new Chess(),
      players: { w: null, b: null }, // playerId
      sockets: { w: null, b: null }, // socket.id
      resigned: null,
    });
  }
  return rooms.get(id);
}

function snapshot(r) {
  const c = r.chess;
  let status = 'playing';
  let winner = null;
  if (r.resigned) {
    status = 'resigned';
    winner = r.resigned === 'w' ? 'b' : 'w';
  } else if (c.isCheckmate()) {
    status = 'checkmate';
    winner = c.turn() === 'w' ? 'b' : 'w';
  } else if (c.isStalemate()) status = 'stalemate';
  else if (c.isDraw()) status = 'draw';

  return {
    fen: c.fen(),
    turn: c.turn(),
    inCheck: c.inCheck(),
    status,
    winner,
    history: c.history({ verbose: true }).map((m) => ({
      san: m.san,
      color: m.color,
      from: m.from,
      to: m.to,
      captured: m.captured || null,
    })),
    online: { w: !!r.sockets.w, b: !!r.sockets.b },
  };
}

io.on('connection', (socket) => {
  socket.on('join', ({ room, playerId }, cb) => {
    room = String(room || '').toUpperCase().slice(0, 12);
    if (!room || !playerId) return cb?.({ error: 'invalid' });
    const r = getRoom(room);

    let color = null;
    if (r.players.w === playerId) color = 'w';
    else if (r.players.b === playerId) color = 'b';
    else if (!r.players.w) color = 'w';
    else if (!r.players.b) color = 'b';

    if (color) {
      r.players[color] = playerId;
      r.sockets[color] = socket.id;
    }
    socket.join(room);
    socket.data = { room, color };
    cb?.({ color }); // null = ผู้ชม
    io.to(room).emit('state', snapshot(r));
  });

  socket.on('move', ({ from, to, promotion }, cb) => {
    const { room, color } = socket.data || {};
    const r = rooms.get(room);
    if (!r || !color) return cb?.({ error: 'ไม่ได้เป็นผู้เล่น' });
    if (r.resigned || r.chess.isGameOver()) return cb?.({ error: 'เกมจบแล้ว' });
    if (r.chess.turn() !== color) return cb?.({ error: 'ยังไม่ถึงตาคุณ' });
    try {
      r.chess.move({ from, to, promotion: promotion || 'q' });
    } catch {
      return cb?.({ error: 'เดินไม่ได้' });
    }
    io.to(room).emit('state', snapshot(r));
    cb?.({ ok: true });
  });

  socket.on('resign', () => {
    const { room, color } = socket.data || {};
    const r = rooms.get(room);
    if (!r || !color || r.chess.isGameOver()) return;
    r.resigned = color;
    io.to(room).emit('state', snapshot(r));
  });

  socket.on('rematch', () => {
    const { room, color } = socket.data || {};
    const r = rooms.get(room);
    if (!r || !color) return;
    r.chess = new Chess();
    r.resigned = null;
    io.to(room).emit('state', snapshot(r));
  });

  socket.on('disconnect', () => {
    const { room, color } = socket.data || {};
    const r = rooms.get(room);
    if (!r || !color) return;
    if (r.sockets[color] === socket.id) {
      r.sockets[color] = null;
      io.to(room).emit('state', snapshot(r));
    }
  });
});

// เสิร์ฟหน้าเว็บที่ build แล้ว (ใช้ตอน production)
const dist = path.join(__dirname, '../dist');
app.use(express.static(dist));
app.get('*', (_, res) => res.sendFile(path.join(dist, 'index.html')));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server on :${PORT}`));