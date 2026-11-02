type Portrait = {
  hair: 'curls' | 'long' | 'swept' | 'bald' | 'short' | 'bun' | 'wing'
  beard?: 'full' | 'short' | 'point'
  moustache?: 'small' | 'large'
  glasses?: boolean
  robe?: boolean
}
const portraits: Record<string, Portrait> = {
  Plato: { hair: 'curls', beard: 'full', robe: true },
  Aristotle: { hair: 'curls', beard: 'short', robe: true },
  'René Descartes': { hair: 'long', moustache: 'small', beard: 'point' },
  'David Hume': { hair: 'curls' },
  'Immanuel Kant': { hair: 'wing' },
  'John Locke': { hair: 'long' },
  'Friedrich Nietzsche': { hair: 'swept', moustache: 'large' },
  'Jean-Paul Sartre': { hair: 'short', glasses: true },
  'Simone de Beauvoir': { hair: 'bun' },
  'Karl Marx': { hair: 'curls', beard: 'full', moustache: 'large' },
  'Thomas Hobbes': { hair: 'long', moustache: 'small', beard: 'point' },
  'John Stuart Mill': { hair: 'short', beard: 'short' },
  'Baruch Spinoza': { hair: 'long' },
  'Arthur Schopenhauer': { hair: 'wing' },
  'Albert Camus': { hair: 'swept' },
  'Søren Kierkegaard': { hair: 'swept' },
  'Bertrand Russell': { hair: 'wing' },
  'Ludwig Wittgenstein': { hair: 'short' },
  'Michel Foucault': { hair: 'bald', glasses: true },
  Confucius: { hair: 'bun', beard: 'point', moustache: 'small', robe: true },
}
const hairPaths = {
  curls:
    'M39 67C26 57 31 43 41 43C34 31 48 25 56 30C58 18 76 20 79 28C91 19 106 28 103 38C119 37 122 53 112 64L107 74L101 49Q91 42 80 47Q67 39 52 49L47 73Z',
  long: 'M38 118Q25 94 35 58C36 28 61 20 80 28C105 24 119 48 114 72Q112 94 121 119L101 123L101 57Q80 64 61 45Q52 56 48 77L52 123Z',
  swept:
    'M40 72L34 52L44 34L41 22L64 29L78 19L98 29L110 43L111 66L103 72L98 46Q78 60 52 49L47 72Z',
  bald: 'M39 72Q32 44 50 32M108 72Q117 44 99 32',
  short:
    'M39 69L36 49Q42 24 75 27Q106 26 112 50L108 72L101 52L94 43Q73 51 52 43L47 69Z',
  bun: 'M48 39C31 24 48 10 62 19C75 8 88 18 87 29Q113 31 114 62L106 83L99 53Q78 53 60 39Q55 59 45 78L36 63Q33 46 48 39Z',
  wing: 'M42 74Q27 77 19 56L33 59L20 39Q36 43 43 33L49 42L46 73M105 74Q121 77 132 54L117 58L130 39Q115 43 105 32L99 42L102 73',
}

/** Original, deliberately simplified line portraits; no remote image requests. */
export default function PhilosopherPortrait({ name }: { name: string }) {
  const p = portraits[name]
  return (
    <svg
      className="philosopher-portrait"
      viewBox="0 0 150 164"
      role="img"
      aria-label={`Stylized illustration of ${name}`}
    >
      <circle className="portrait-disc" cx="75" cy="77" r="65" />
      <g
        className="portrait-drawing"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          className="portrait-shoulders"
          d={
            p?.robe
              ? 'M16 153Q23 122 56 116L74 140L96 115Q128 122 136 153M43 124L65 153M96 123L81 153'
              : 'M16 153Q26 122 58 119L75 137L92 119Q126 122 136 153M58 119L52 140L68 135L75 153L82 135L98 140L92 119'
          }
        />
        <g className="portrait-head">
          {p && (
            <path
              className={`portrait-hair hair-${p.hair}`}
              d={hairPaths[p.hair]}
            />
          )}
          <path
            className="portrait-face"
            d="M46 64Q40 58 39 70Q39 80 47 82Q49 106 64 114L64 123M103 64Q110 58 111 70Q111 80 103 82Q101 106 86 114L86 123M47 62Q46 38 75 36Q103 37 103 62"
          />
          <path d="M55 65L64 63M86 63L95 65M74 69L70 86L78 87M65 98Q75 102 85 98" />
          <path d="M59 71h3M88 71h3" strokeWidth="2.5" />
          {p?.glasses && (
            <g>
              <rect x="49" y="65" width="20" height="15" rx="5" />
              <rect x="81" y="65" width="20" height="15" rx="5" />
              <path d="M69 69Q75 66 81 69M42 67L49 69M101 69L108 67" />
            </g>
          )}
          {p?.beard === 'full' && (
            <path
              className="portrait-hair"
              d="M48 85L57 95L65 91L75 96L86 91L96 95L103 85Q109 115 94 130L87 125L75 140L64 127L57 131Q42 115 48 85ZM59 103L65 117M76 105L75 127M91 103L85 117"
            />
          )}
          {p?.beard === 'short' && (
            <path
              className="portrait-hair"
              d="M48 86L61 102L75 106L91 100L103 86L99 108L75 123L53 109ZM61 108L65 114M87 108L83 114"
            />
          )}
          {p?.beard === 'point' && (
            <path
              className="portrait-hair"
              d="M66 108L75 127L84 108Q75 113 66 108Z"
            />
          )}
          {p?.moustache && (
            <path
              className="portrait-hair"
              d={
                p.moustache === 'large'
                  ? 'M75 87Q60 83 49 96L47 113Q62 110 75 96Q88 110 103 113L101 96Q90 83 75 87Z'
                  : 'M75 89Q64 87 56 96Q68 98 75 92Q82 98 94 96Q86 87 75 89Z'
              }
            />
          )}
        </g>
        <path className="portrait-baseline" d="M14 154H138" />
      </g>
    </svg>
  )
}
