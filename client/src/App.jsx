import { useMemo, useState } from 'react'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(
  /\/+$/,
  '',
)
const assessRequestUrl =
  import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL
    ? '/assess'
    : `${apiBaseUrl}/assess`

const scale = [
  { value: 0, label: 'SD' },
  { value: 0.25, label: 'D' },
  { value: 0.5, label: 'N' },
  { value: 0.75, label: 'A' },
  { value: 1, label: 'SA' },
]

const questionGroups = [
  {
    axis: 'EPISTEMOLOGY',
    description: 'Rationalism → Empiricism',
    questions: [
      {
        id: 1,
        text: 'The most reliable way to gain knowledge is through direct sensory observation and experimentation, not pure reasoning alone.',
      },
      {
        id: 2,
        text: 'A claim should be accepted only if it can be tested and confirmed through observable evidence.',
      },
      {
        id: 3,
        text: 'There are no meaningful truths we can arrive at through reason alone, independent of any experience.',
      },
    ],
  },
  {
    axis: 'METAPHYSICS',
    description: 'Idealism → Materialism',
    questions: [
      {
        id: 4,
        text: 'Physical matter and energy are all that fundamentally exist; consciousness and thought are products of the brain.',
      },
      {
        id: 5,
        text: 'Even our most private mental experiences — emotions, memories, imagination — are ultimately reducible to physical processes.',
      },
      {
        id: 6,
        text: 'A complete scientific account of the universe would not need to invoke any non-physical entities or forces.',
      },
    ],
  },
  {
    axis: 'ETHICS',
    description: 'Moral Realism → Moral Relativism',
    questions: [
      {
        id: 7,
        text: "Moral judgments such as 'slavery is wrong' are only true relative to a given culture or historical period, not universally.",
      },
      {
        id: 8,
        text: "There are no moral facts 'out there' in the world waiting to be discovered; moral values are constructed by societies.",
      },
      {
        id: 9,
        text: 'Two societies with opposing moral codes are not in genuine disagreement about moral truth — they simply have different practices.',
      },
    ],
  },
  {
    axis: 'FREE WILL',
    description: 'Hard Determinism → Libertarian Free Will',
    questions: [
      {
        id: 10,
        text: 'People are the genuine originators of their own choices, in a way that cannot be fully explained by prior causes.',
      },
      {
        id: 11,
        text: 'Even if scientists could perfectly map your brain, they would still be unable to predict every decision you make.',
      },
      {
        id: 12,
        text: 'Moral responsibility requires that a person could truly have done otherwise, and I believe humans genuinely have this capacity.',
      },
    ],
  },
  {
    axis: 'POLITICS',
    description: 'Authoritarianism → Libertarianism',
    questions: [
      {
        id: 13,
        text: 'Individuals should be free to make their own choices about their lives as long as they do not harm others.',
      },
      {
        id: 14,
        text: 'Centralized government control over the economy and personal behavior tends to produce worse outcomes than voluntary cooperation.',
      },
      {
        id: 15,
        text: 'Most laws that restrict what consenting adults do with their own bodies or property are unjustified intrusions.',
      },
    ],
  },
  {
    axis: 'THEOLOGY',
    description: 'Strong Theism → Strong Atheism',
    questions: [
      {
        id: 16,
        text: 'The existence of the universe and life within it can be fully explained without invoking any god or supernatural designer.',
      },
      {
        id: 17,
        text: 'Religious experiences and personal testimonies of divine encounters are more likely explained by psychology than by the existence of a deity.',
      },
      {
        id: 18,
        text: 'There is no compelling evidence that would justify believing in any god, and the default rational position is disbelief.',
      },
    ],
  },
]

const allQuestions = questionGroups.flatMap((group) =>
  group.questions.map((question) => ({
    ...question,
    axis: group.axis,
    description: group.description,
  })),
)

const pageOrder = ['home', 'questions', 'response']

const axisOrder = [
  'epistemology',
  'metaphysics',
  'ethics',
  'free_will',
  'politics',
  'theology',
]

const axisLabels = {
  epistemology: 'Epistemology',
  metaphysics: 'Metaphysics',
  ethics: 'Ethics',
  free_will: 'Free will',
  politics: 'Politics',
  theology: 'Theology',
}

function buildAxisProfile(questionGroups, answers) {
  return questionGroups.reduce((profile, group) => {
    const total = group.questions.reduce(
      (sum, question) => sum + (answers[question.id] ?? 0.5),
      0,
    )

    profile[group.axis.toLowerCase().replace(' ', '_')] = total / group.questions.length
    return profile
  }, {})
}

async function fetchPortrait(name) {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.thumbnail?.source ?? null
  } catch {
    return null
  }
}

function highlightJson(json) {
  return json
    .replace(/("(\\.|[^"\\])*")(\s*:)?/g, (match, str, _esc, colon) =>
      colon
        ? `<span class="json-key">${str}</span>${colon}`
        : `<span class="json-string">${str}</span>`,
    )
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="json-number">$1</span>')
    .replace(/\b(true|false|null)\b/g, '<span class="json-bool">$1</span>')
}

function getRadarPoints(values, width = 460, height = 420, radius = 136) {
  const centerX = width / 2
  const centerY = height / 2

  return axisOrder.map((axis, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / axisOrder.length
    const value = values[axis] ?? 0
    const distance = radius * value
    const x = centerX + Math.cos(angle) * distance
    const y = centerY + Math.sin(angle) * distance

    return `${x},${y}`
  })
}

function RadarChart({ userProfile, philosopherProfile, title }) {
  const width = 460
  const height = 420
  const centerX = width / 2
  const centerY = height / 2
  const rings = [0.2, 0.4, 0.6, 0.8, 1]
  const userPoints = getRadarPoints(userProfile, width, height)
  const philosopherPoints = getRadarPoints(philosopherProfile, width, height)

  return (
    <figure className="radar-card">
      <figcaption className="radar-header">
        <div>
          <p className="eyebrow">Radar chart</p>
          <h3>{title}</h3>
        </div>
      </figcaption>

      <svg
        className="radar-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={title}
      >
        {rings.map((ring) => {
          const ringRadius = 136 * ring
          return (
            <circle
              key={ring}
              cx={centerX}
              cy={centerY}
              r={ringRadius}
              className="radar-grid-ring"
            />
          )
        })}

        {axisOrder.map((axis, index) => {
          const angle = -Math.PI / 2 + (Math.PI * 2 * index) / axisOrder.length
          const x = centerX + Math.cos(angle) * 136
          const y = centerY + Math.sin(angle) * 136
          const labelRadius = 145
          const lx = centerX + Math.cos(angle) * labelRadius
          const ly = centerY + Math.sin(angle) * labelRadius

          return (
            <g key={axis}>
              <line
                x1={centerX}
                y1={centerY}
                x2={x}
                y2={y}
                className="radar-axis-line"
              />
              <text
                x={lx}
                y={ly}
                textAnchor={Math.abs(Math.cos(angle)) < 0.3 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end'}
                dominantBaseline="middle"
                className="radar-axis-label"
              >
                {axisLabels[axis]}
              </text>
            </g>
          )
        })}

        <polygon points={philosopherPoints} className="radar-area radar-area-philosopher" />
        <polygon points={userPoints} className="radar-area radar-area-user" />

        {axisOrder.map((axis, index) => {
          const userAngle = -Math.PI / 2 + (Math.PI * 2 * index) / axisOrder.length
          const philosopherValue = philosopherProfile[axis] ?? 0
          const userValue = userProfile[axis] ?? 0
          const ux = centerX + Math.cos(userAngle) * 136 * userValue
          const uy = centerY + Math.sin(userAngle) * 136 * userValue
          const px = centerX + Math.cos(userAngle) * 136 * philosopherValue
          const py = centerY + Math.sin(userAngle) * 136 * philosopherValue

          return (
            <g key={`${axis}-points`}>
              <circle cx={px} cy={py} r="4.2" className="radar-point radar-point-philosopher" />
              <circle cx={ux} cy={uy} r="4.2" className="radar-point radar-point-user" />
            </g>
          )
        })}
      </svg>

      <div className="radar-legend">
        <span>
          <i className="legend-swatch legend-user" />
          User
        </span>
        <span>
          <i className="legend-swatch legend-philosopher" />
          Philosopher
        </span>
      </div>
    </figure>
  )
}

function App() {
  const [page, setPage] = useState('home')
  const [answers, setAnswers] = useState(
    Object.fromEntries(allQuestions.map((question) => [question.id, 0.5])),
  )
  const [requestVisible, setRequestVisible] = useState(false)
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0)
  const [matches, setMatches] = useState([])
  const [portraits, setPortraits] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tryItResult, setTryItResult] = useState(null)
  const [tryItLoading, setTryItLoading] = useState(false)
  const [tryItError, setTryItError] = useState(null)

  const payload = useMemo(
    () =>
      allQuestions.map((question) => ({
        question_id: question.id,
        score: answers[question.id],
      })),
    [answers],
  )

  const userProfile = useMemo(
    () => buildAxisProfile(questionGroups, answers),
    [answers],
  )

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(assessRequestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const data = await res.json()
      const normalized = data.map((item) => ({
        name: item.philosopher.name,
        scores: item.philosopher.scores,
        justifications: item.philosopher.justifications,
        distance: item.distance.toFixed(4),
      }))
      const top3 = normalized.slice(0, 3)
      setMatches(top3)
      const portraitEntries = await Promise.all(
        top3.map(async (match) => [match.name, await fetchPortrait(match.name)]),
      )
      setPortraits(Object.fromEntries(portraitEntries))
      setSelectedMatchIndex(0)
      setPage('response')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleTryIt() {
    setTryItLoading(true)
    setTryItError(null)
    try {
      const samplePayload = allQuestions.map((q) => ({
        question_id: q.id,
        score: 0.5,
      }))
      const res = await fetch(assessRequestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(samplePayload),
      })
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const data = await res.json()
      setTryItResult(data.slice(0, 3))
    } catch (err) {
      setTryItError(err.message)
    } finally {
      setTryItLoading(false)
    }
  }

  const selectedMatch = matches[selectedMatchIndex]
  const payloadString = JSON.stringify(payload, null, 2)
  const curlSnippet = `curl -X POST "${apiBaseUrl}/assess" \\
  -H "Content-Type: application/json" \\
  -d '${payloadString.replaceAll("'", "\\'")}'`

  const currentPageIndex = pageOrder.indexOf(page)

  return (
    <div className="site-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <div className="paper-grid" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">R</span>
          <div>
            <p className="brand-name">René</p>
            <p className="brand-subtitle">A philosophical matching instrument</p>
          </div>
        </div>

        <nav className="nav" aria-label="Primary">
          <button
            className={page === 'home' ? 'nav-link active' : 'nav-link'}
            type="button"
            onClick={() => setPage('home')}
          >
            Home
          </button>
          <button
            className={page === 'questions' ? 'nav-link active' : 'nav-link'}
            type="button"
            onClick={() => setPage('questions')}
          >
            Questions
          </button>
          <button
            className={page === 'response' ? 'nav-link active' : 'nav-link'}
            type="button"
            onClick={() => setPage('response')}
          >
            Response
          </button>
        </nav>
      </header>

      <main className="main-stage">
        {page === 'home' && (
          <section className="hero-view view-enter">
              <p className="eyebrow">POST /assess</p>
              <h1>Elegant API for philosophical matching.</h1>
              <p className="lede">
                René accepts a structured response set and returns the philosopher
                who most closely reflects the user’s positions.
              </p>

              <div className="hero-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => setPage('questions')}
                >
                  Begin assessment
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setPage('response')}
                >
                  View result format
                </button>
              </div>
          </section>
        )}

        {page === 'home' && (
          <section className="try-it-section view-enter">
            <div className="page-intro">
              <p className="eyebrow">Try it now</p>
              <h2>Send a sample request</h2>
              <p>
                This sends a neutral response set (every question answered at
                0.5) to the live API and shows the raw JSON returned.
              </p>
            </div>

            <div className="try-it-panel">
              <div className="try-it-meta">
                <div className="meta-item">
                  <span className="meta-label">Endpoint</span>
                  <code>{apiBaseUrl}/assess</code>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Payload</span>
                  <span>18 questions, every answer set to 0.5</span>
                </div>
              </div>

              <button
                className="primary-button"
                type="button"
                onClick={handleTryIt}
                disabled={tryItLoading}
              >
                {tryItLoading ? 'Sending…' : 'Run sample request'}
              </button>

              {tryItError && <p className="error-note">{tryItError}</p>}

              {tryItResult && (
                <pre className="code-block try-it-result">
                  <code
                    dangerouslySetInnerHTML={{
                      __html: highlightJson(JSON.stringify(tryItResult, null, 2)),
                    }}
                  />
                </pre>
              )}
            </div>
          </section>
        )}

        {page === 'questions' && (
          <section className="page-frame view-enter">
            <div className="page-intro">
              <p className="eyebrow">Assessment</p>
              <h2>Answer the full set</h2>
              <p>
                Each axis is represented by three prompts. Choose a position on
                the five-point scale. The request body remains hidden until you
                choose to reveal it.
              </p>
            </div>

            <div className="question-toolbar">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setRequestVisible((current) => !current)}
              >
                {requestVisible ? 'Hide request body' : 'Reveal request body'}
              </button>

              <span className="toolbar-note">
                {requestVisible
                  ? 'Request body visible'
                  : 'Request body remains concealed'}
              </span>
            </div>

            <div
              className={requestVisible ? 'page-grid request-open' : 'page-grid'}
            >
              <div className="question-column">
                {questionGroups.map((group) => (
                  <section className="axis-block" key={group.axis}>
                    <div className="axis-heading">
                      <p className="axis-name">{group.axis}</p>
                      <span>{group.description}</span>
                    </div>

                    <div className="question-list">
                      {group.questions.map((question, index) => (
                        <article className="question-card" key={question.id}>
                          <div className="question-meta">
                            <span className="question-number">
                              {String(question.id).padStart(2, '0')}
                            </span>
                            <div>
                              <h3>{question.text}</h3>
                            </div>
                          </div>

                          <div className="scale" role="group" aria-label={question.text}>
                            {scale.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                className={
                                  answers[question.id] === option.value
                                    ? 'scale-option active'
                                    : 'scale-option'
                                }
                                onClick={() =>
                                  setAnswers((current) => ({
                                    ...current,
                                    [question.id]: option.value,
                                  }))
                                }
                              >
                                <span>{option.label}</span>
                              </button>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
                <div className="submit-row">
                  {error && <p className="error-note">{error}</p>}
                  <button
                    className="primary-button"
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? 'Computing…' : 'Submit assessment'}
                  </button>
                </div>
              </div>

              {requestVisible ? (
                <aside className="request-pane reveal">
                  <div className="sticky-card">
                    <p className="eyebrow">Request body</p>
                    <h3>Prepared for POST /assess</h3>
                    <pre className="code-block">
                      <code>{payloadString}</code>
                    </pre>
                    <div className="endpoint-line">
                      <span>POST</span>
                      <code>{apiBaseUrl}/assess</code>
                    </div>
                  </div>
                </aside>
              ) : null}
            </div>
          </section>
        )}

        {page === 'response' && (
          matches.length === 0 ? (
            <section className="page-frame view-enter">
              <div className="page-intro">
                <p className="eyebrow">Result</p>
                <h2>No results yet</h2>
                <p>Complete the assessment and submit to see your matches.</p>
              </div>
              <button
                className="primary-button"
                type="button"
                onClick={() => setPage('questions')}
              >
                Go to assessment
              </button>
            </section>
          ) : (
            <section className="page-frame view-enter response-page">
              <div className="page-intro">
                <p className="eyebrow">Result</p>
                <h2>Ranked response</h2>
                <p>
                  The API returns the closest philosopher first, followed by the
                  full score map and justifications for each axis.
                </p>
              </div>

              <div className="match-tabs">
                {matches.map((match, index) => (
                  <button
                    key={match.name}
                    type="button"
                    className={index === selectedMatchIndex ? 'match-tab active' : 'match-tab'}
                    onClick={() => setSelectedMatchIndex(index)}
                  >
                    <span className="match-tab-rank">#{index + 1}</span>
                    <span className="match-tab-name">{match.name}</span>
                    <span className="match-tab-distance">{match.distance}</span>
                  </button>
                ))}
              </div>

              <div className="response-columns">
                <div className="result-panel radar-panel">
                  <RadarChart
                    title={`User profile vs ${selectedMatch.name}`}
                    userProfile={userProfile}
                    philosopherProfile={selectedMatch.scores}
                  />
                </div>

                <div className="result-panel profile-panel">
                  <div className="profile-header">
                    <div className="portrait-frame">
                      {portraits[selectedMatch.name] ? (
                        <img
                          src={portraits[selectedMatch.name]}
                          alt={selectedMatch.name}
                          className="portrait-image"
                        />
                      ) : (
                        <div className="portrait-placeholder">
                          {selectedMatch.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="profile-header-text">
                      <h3>{selectedMatch.name}</h3>
                      <span className="result-distance">
                        distance {selectedMatch.distance}
                      </span>
                    </div>
                  </div>

                  <div className="justification-grid">
                    {axisOrder.map((axis) => (
                      <div className="justification-item" key={axis}>
                        <div className="justification-header">
                          <span className="justification-axis">{axisLabels[axis]}</span>
                          <span className="justification-score">
                            {selectedMatch.scores[axis]}
                          </span>
                        </div>
                        <div className="score-bar-track">
                          <div
                            className="score-bar-fill"
                            style={{ width: `${selectedMatch.scores[axis] * 100}%` }}
                          />
                        </div>
                        <p className="justification-text">
                          {selectedMatch.justifications[axis]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )
        )}
      </main>

      <footer className="footer">
        <span>René API</span>
        <span>Page {currentPageIndex + 1} of {pageOrder.length}</span>
      </footer>
    </div>
  )
}

export default App
