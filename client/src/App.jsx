import { useMemo, useState } from 'react'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

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

const sampleMatches = [
  {
    name: 'Plato',
    distance: '0.123',
    scores: {
      epistemology: 0.15,
      metaphysics: 0.08,
      ethics: 0.12,
      free_will: 0.5,
      politics: 0.18,
      theology: 0.22,
    },
    justifications: {
      epistemology:
        'Plato grounds knowledge in reason and recollection rather than sensory certainty.',
      metaphysics:
        'The Theory of Forms places true reality beyond the material world.',
      ethics:
        'The Good is objective and discoverable through philosophical inquiry.',
      free_will:
        'Plato gestures toward agency, though the dialogues leave the issue partly open.',
      politics:
        'The Republic envisions an ordered hierarchy governed by philosopher-kings.',
      theology:
        'The cosmos is ordered by a divine Demiurge in the Timaeus.',
    },
  },
  {
    name: 'Aristotle',
    distance: '0.241',
    scores: {
      epistemology: 0.31,
      metaphysics: 0.28,
      ethics: 0.37,
      free_will: 0.44,
      politics: 0.33,
      theology: 0.29,
    },
    justifications: {
      epistemology:
        'Aristotle begins from experience and proceeds by careful classification.',
      metaphysics:
        'He remains more grounded in substance, form, and observable reality.',
      ethics:
        'Virtue ethics treats moral flourishing as objective but practical.',
      free_will:
        'His account of voluntary action leaves room for deliberative responsibility.',
      politics:
        'He values civic order, but his politics are less utopian than Plato’s.',
      theology:
        'His unmoved mover is philosophical rather than devotional in character.',
    },
  },
  {
    name: 'Kant',
    distance: '0.388',
    scores: {
      epistemology: 0.46,
      metaphysics: 0.39,
      ethics: 0.56,
      free_will: 0.61,
      politics: 0.47,
      theology: 0.44,
    },
    justifications: {
      epistemology:
        'Kant gives reason a central role while limiting what experience can reveal.',
      metaphysics:
        'His critical philosophy distinguishes appearances from things-in-themselves.',
      ethics:
        'Duty and universal law are central to his moral philosophy.',
      free_will:
        'Freedom is necessary for moral responsibility in his system.',
      politics:
        'He supports ordered rights, though not authoritarian control.',
      theology:
        'God is a postulate of practical reason rather than empirical fact.',
    },
  },
]

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

function getRadarPoints(values, size = 420, radius = 136) {
  const center = size / 2

  return axisOrder.map((axis, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / axisOrder.length
    const value = values[axis] ?? 0
    const distance = radius * value
    const x = center + Math.cos(angle) * distance
    const y = center + Math.sin(angle) * distance

    return `${x},${y}`
  })
}

function RadarChart({ userProfile, philosopherProfile, title }) {
  const size = 420
  const center = size / 2
  const rings = [0.2, 0.4, 0.6, 0.8, 1]
  const userPoints = getRadarPoints(userProfile, size)
  const philosopherPoints = getRadarPoints(philosopherProfile, size)

  return (
    <figure className="radar-card">
      <figcaption className="radar-header">
        <div>
          <p className="eyebrow">Radar chart</p>
          <h3>{title}</h3>
        </div>

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
      </figcaption>

      <svg
        className="radar-svg"
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={title}
      >
        {rings.map((ring) => {
          const ringRadius = 136 * ring
          return (
            <circle
              key={ring}
              cx={center}
              cy={center}
              r={ringRadius}
              className="radar-grid-ring"
            />
          )
        })}

        {axisOrder.map((axis, index) => {
          const angle = -Math.PI / 2 + (Math.PI * 2 * index) / axisOrder.length
          const x = center + Math.cos(angle) * 136
          const y = center + Math.sin(angle) * 136
          const labelRadius = 160
          const lx = center + Math.cos(angle) * labelRadius
          const ly = center + Math.sin(angle) * labelRadius

          return (
            <g key={axis}>
              <line
                x1={center}
                y1={center}
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
          const ux = center + Math.cos(userAngle) * 136 * userValue
          const uy = center + Math.sin(userAngle) * 136 * userValue
          const px = center + Math.cos(userAngle) * 136 * philosopherValue
          const py = center + Math.sin(userAngle) * 136 * philosopherValue

          return (
            <g key={`${axis}-points`}>
              <circle cx={px} cy={py} r="4.2" className="radar-point radar-point-philosopher" />
              <circle cx={ux} cy={uy} r="4.2" className="radar-point radar-point-user" />
            </g>
          )
        })}
      </svg>
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

  const selectedMatch = sampleMatches[selectedMatchIndex]

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
            <div className="hero-copy">
              <p className="eyebrow">POST /assess</p>
              <h1>Elegant API for philosophical matching.</h1>
              <p className="lede">
                René accepts a structured response set and returns the philosopher
                who most closely reflects the user’s positions. The interface
                should feel measured, refined, and quietly ceremonial.
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
            </div>

            <aside className="hero-sidebar">
              <div className="quiet-card">
                <p className="quiet-label">Endpoint</p>
                <code>{apiBaseUrl}/assess</code>
              </div>
              <div className="quiet-card">
                <p className="quiet-label">Payload</p>
                <p>JSON array of question_id and score pairs.</p>
              </div>
              <div className="quiet-card">
                <p className="quiet-label">Result</p>
                <p>Ranked philosophers with scores and justifications.</p>
              </div>
            </aside>
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
          <section className="page-frame view-enter">
            <div className="page-intro">
              <p className="eyebrow">Result</p>
              <h2>Ranked response</h2>
              <p>
                The API returns the closest philosopher first, followed by the
                full score map and justifications for each axis.
              </p>
            </div>

            <div className="response-layout">
              <aside className="response-sidebar">
                <div className="summary-card">
                  <p className="quiet-label">Endpoint</p>
                  <code>{apiBaseUrl}/assess</code>
                </div>
                <div className="summary-card">
                  <p className="quiet-label">Selected match</p>
                  <p>{selectedMatch.name}</p>
                </div>
                <div className="match-picker">
                  <p className="quiet-label">Runner-ups</p>
                  {sampleMatches.map((match, index) => (
                    <button
                      key={match.name}
                      type="button"
                      className={index === selectedMatchIndex ? 'pick-chip active' : 'pick-chip'}
                      onClick={() => setSelectedMatchIndex(index)}
                    >
                      <span>#{index + 1}</span>
                      <strong>{match.name}</strong>
                      <em>{match.distance}</em>
                    </button>
                  ))}
                </div>
              </aside>

              <div className="response-main">
                <RadarChart
                  title={`User profile vs ${selectedMatch.name}`}
                  userProfile={userProfile}
                  philosopherProfile={selectedMatch.scores}
                />

                <article className="result-card selected-result">
                  <div className="result-topline">
                    <span className="result-rank">#{selectedMatchIndex + 1}</span>
                    <span className="result-distance">distance {selectedMatch.distance}</span>
                  </div>

                  <div className="result-title-row">
                    <h3>{selectedMatch.name}</h3>
                    <span className="result-orb" aria-hidden="true" />
                  </div>

                  <p className="result-summary">
                    {selectedMatch.justifications.epistemology}
                  </p>

                  <div className="mini-score-grid">
                    {Object.entries(selectedMatch.scores).map(([axis, value]) => (
                      <div className="mini-score" key={axis}>
                        <span>{axisLabels[axis]}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </div>
          </section>
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
