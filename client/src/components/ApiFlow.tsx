export default function ApiFlow({ running = false }: { running?: boolean }) {
  return (
    <svg
      className={`api-flow ${running ? 'running' : ''}`}
      viewBox="0 0 640 100"
      role="img"
      aria-label="18 answers are averaged into six axis scores, then ranked by distance"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.2">
        <path className="flow-track" d="M130 34H282M352 34H504" />
        <path className="flow-signal" d="M130 34H282M352 34H504" />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={78 + i * 8} y={12 + i * 7} width="28" height="32" rx="2" />
            <path d={`M${84 + i * 8} ${21 + i * 7}h16m-16 6h11`} />
          </g>
        ))}
        <path
          className="flow-hex"
          d="M317 8L340 21V47L317 60L294 47V21ZM317 8V60M294 21L340 47M294 47L340 21"
        />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <circle cx="519" cy={17 + i * 17} r="2" />
            <path d={`M530 ${17 + i * 17}h${36 - i * 9}`} />
          </g>
        ))}
      </g>
      <g className="flow-labels" textAnchor="middle">
        <text x="104" y="89">
          18 answers
        </text>
        <text x="317" y="89">
          6 axis averages
        </text>
        <text x="540" y="89">
          Ranked matches
        </text>
      </g>
    </svg>
  )
}
