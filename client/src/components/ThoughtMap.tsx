import { useEffect, useId, useRef, useState } from 'react'

const labels = [
  'Knowledge',
  'Reality',
  'Ethics',
  'Free will',
  'Politics',
  'Belief',
]
const point = (index: number, radius: number) => {
  const angle = -Math.PI / 2 + (index * Math.PI) / 3
  return [260 + Math.cos(angle) * radius, 250 + Math.sin(angle) * radius]
}
const polygon = (values: number[]) =>
  values.map((value, i) => point(i, 170 * value).join(',')).join(' ')

export default function ThoughtMap({
  values,
  comparison,
  activeAxis,
  label = 'A map of six philosophical perspectives',
}: {
  values: number[]
  comparison?: number[]
  activeAxis?: number
  label?: string
}) {
  const gridId = useId()
  const [displayValues, setDisplayValues] = useState(values)
  const currentValues = useRef(values)
  const targetKey = values.join(',')
  useEffect(() => {
    const target = targetKey.split(',').map(Number)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      currentValues.current = target
      setDisplayValues(target)
      return
    }
    const start = performance.now()
    const from = currentValues.current
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 280, 1)
      const ease = 1 - (1 - progress) ** 3
      const next = target.map((v, i) => from[i] + (v - from[i]) * ease)
      currentValues.current = next
      setDisplayValues(next)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [targetKey])
  return (
    <svg
      className="thought-map"
      viewBox="0 0 520 500"
      role="img"
      aria-label={label}
    >
      <defs>
        <pattern
          id={gridId}
          width="26"
          height="26"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 26 0 L 0 0 0 26"
            fill="none"
            stroke="currentColor"
            strokeOpacity=".055"
          />
        </pattern>
      </defs>
      <rect width="520" height="500" fill={`url(#${gridId})`} />
      <circle cx="260" cy="250" r="199" className="map-orbit" />
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <polygon
          key={r}
          points={polygon(Array(6).fill(r))}
          className="map-grid"
        />
      ))}
      {labels.map((name, i) => {
        const [x, y] = point(i, 170)
        const [lx, ly] = point(i, 211)
        return (
          <g
            key={name}
            className={activeAxis === i ? 'map-axis is-active' : 'map-axis'}
          >
            <line x1="260" y1="250" x2={x} y2={y} />
            <circle cx={x} cy={y} r="3" />
            <text x={lx} y={ly - 6} textAnchor="middle">
              {name}
            </text>
          </g>
        )
      })}
      {comparison && (
        <polygon className="map-comparison" points={polygon(comparison)} />
      )}
      <polygon className="map-shape" points={polygon(displayValues)} />
      {displayValues.map((v, i) => {
        const [cx, cy] = point(i, 170 * v)
        return (
          <circle
            key={i}
            className="map-node"
            cx={cx}
            cy={cy}
            r={activeAxis === i ? 6 : 4}
          />
        )
      })}
      <path d="M254 250h12M260 244v12" className="map-center" />
    </svg>
  )
}
