import { PIECES } from './pieces.js';

const BISTRO_SET = '3d_chesskid';

// 🎨 เลือกโทนขาว-ดำที่ชอบได้เลยครับ (สลับ // เอา)
const PIECE_FILTER = 
  'grayscale(1) contrast(0.95) brightness(0.98)'; // 1. ขาว-ดำเนื้อด้าน (สีขาวนวล กับ สีเทาถ่านนุ่มๆ ไม่เงา)
  // 'grayscale(1) contrast(1.15) brightness(0.95)'; // 2. ขาว-ดำเข้มข้น (สีดำจะเข้มชัดขึ้น ตัดกับสีขาวชัดเจน)
  // 'grayscale(1) sepia(0.15) contrast(0.92)';      // 3. ขาว-ดำอมครีมอุ่นๆ (เข้ากับพื้นหลังกระดาษคาเฟ่)

export default function PieceIcon({ color, type, theme }) {
  if (theme === 'bistro') {
    return (
      <img
        className="piece-img bistro-piece"
        src={`https://images.chesscomfiles.com/chess-themes/pieces/${BISTRO_SET}/150/${color}${type}.png`}
        alt={`${color}${type}`}
        draggable={false}
        style={{ filter: PIECE_FILTER }}
      />
    );
  }

  const p = PIECES[color][type];
  return (
    <img
      className="piece-img"
      src={p.img}
      alt={p.name}
      draggable={false}
    />
  );
}