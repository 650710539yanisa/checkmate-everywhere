
const THEMES = {
  bag: {
    name: 'In My Bag',
    desc: 'Stone tiles with fashionable bag-inspired pieces.',
    light: '#a3a096',
    dark: '#716e67',
  },
  bistro: {
    name: 'Bistro Sketch', // หรือใช้ชื่อ 'Tablecloth Doodle' ก็ได้ครับ
    desc: 'Hand-drawn paper board with classic wooden pieces.',
    light: '#e8dfd1', // สีกระดาษปูโต๊ะโทนอุ่น
    dark: '#4a4744',  // สีเทาเข้มเหมือนแรเงาด้วยดินสอ/ชาร์โคล
  },
  classic: {
    name: 'Classic',
    desc: 'A traditional wooden board and classic chess pieces.',
    light: '#f0d9b5',
    dark: '#b58863',
  },
};

export default function ThemePage({
  value,
  onChange,
  onBack,
  onContinue,
  room,
}) {
  return (
    <div className="table">
      <div className="theme-page">
        

        <h1>Choose Your Theme</h1>
        <p>Select your favorite look before starting the game.</p>

        {room && (
          <p className="room">
            Room Code: <strong>{room}</strong>
          </p>
        )}

        <div className="theme-list">
          {Object.entries(THEMES).map(([id, theme]) => (
            <button
              type="button"
              key={id}
              className={
                'theme-card' + (value === id ? ' active' : '')
              }
              onClick={() => onChange(id)}
              aria-pressed={value === id}
            >
              <span
                className="swatch"
                style={{
                  '--l': theme.light,
                  '--d': theme.dark,
                }}
              >
                <i />
                <i />
                <i />
                <i />
              </span>

              <span className="theme-info">
                <strong>{theme.name}</strong>
                <span className="desc">{theme.desc}</span>
              </span>

              <span className="theme-check">
                {value === id ? '✓ Selected' : 'Select'}
              </span>
            </button>
          ))}
        </div>

        <div className="actions">
          <button className="btn" onClick={onBack}>
            Back
          </button>

          <button
            className="btn primary"
            onClick={onContinue}
          >
            Start Game →
          </button>
        </div>
      </div>
    </div>
  );
}
