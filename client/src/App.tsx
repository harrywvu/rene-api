import { useEffect, useRef, useState } from 'react'
import ThoughtMap from './components/ThoughtMap'
import PhilosopherPortrait from './components/PhilosopherPortrait'
import ApiFlow from './components/ApiFlow'
import MarkdownDocument, {
  extractMarkdownHeadings,
} from './components/MarkdownDocument'
import developerDocs from './docs/developer.md?raw'

type Axis =
  | 'epistemology'
  | 'metaphysics'
  | 'ethics'
  | 'free_will'
  | 'politics'
  | 'theology'
type AxisProfile = Record<Axis, number>
type QuestionGroup = {
  axis: string
  description: string
  questions: { id: number; text: string }[]
}
type AssessmentMatch = {
  philosopher: {
    name: string
    scores: AxisProfile
    justifications: Record<Axis, string>
  }
  distance: number
}
type Page = 'home' | 'questions' | 'response' | 'docs'

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
).replace(/\/+$/, '')
const assessRequestUrl =
  import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL
    ? '/assess'
    : `${apiBaseUrl}/assess`

const scale = [
  { value: 0, label: 'Strongly disagree' },
  { value: 0.25, label: 'Disagree' },
  { value: 0.5, label: 'Neutral' },
  { value: 0.75, label: 'Agree' },
  { value: 1, label: 'Strongly agree' },
]

const questionGroups: QuestionGroup[] = [
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

const axisOrder: Axis[] = [
  'epistemology',
  'metaphysics',
  'ethics',
  'free_will',
  'politics',
  'theology',
]

const axisLabels: Record<Axis, string> = {
  epistemology: 'Epistemology',
  metaphysics: 'Metaphysics',
  ethics: 'Ethics',
  free_will: 'Free will',
  politics: 'Politics',
  theology: 'Theology',
}

function buildAxisProfile(
  questionGroups: QuestionGroup[],
  answers: Record<number, number>,
): AxisProfile {
  return Object.fromEntries(
    questionGroups.map((group) => {
      const total = group.questions.reduce(
        (sum, question) => sum + (answers[question.id] ?? 0.5),
        0,
      )
      return [
        group.axis.toLowerCase().replace(' ', '_'),
        total / group.questions.length,
      ]
    }),
  ) as AxisProfile
}

const axisPrompts = [
  'How do you know?',
  'What is real?',
  'What makes something right?',
  'Are your choices your own?',
  'How should we live together?',
  'What lies beyond us?',
]
const examples = [
  {
    name: 'René Descartes',
    values: [0.08, 0.22, 0.35, 0.72, 0.5, 0.25],
  },
  {
    name: 'Aristotle',
    values: [0.42, 0.58, 0.28, 0.55, 0.5, 0.32],
  },
]
const Arrow = () => <span aria-hidden="true">↗</span>

async function requestAssessment(
  answers: Record<number, number>,
): Promise<AssessmentMatch[]> {
  const response = await fetch(assessRequestUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      allQuestions.map((q) => ({ question_id: q.id, score: answers[q.id] })),
    ),
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok)
    throw new Error(
      response.status === 429
        ? 'Too many requests. Give it a moment, then try again.'
        : 'The API is temporarily unavailable. Your answers are still here. Please try again.',
    )
  const data: unknown = await response.json()
  if (
    !Array.isArray(data) ||
    !data.length ||
    !data.every(
      (item) =>
        item &&
        typeof item.distance === 'number' &&
        Number.isFinite(item.distance) &&
        item.distance >= 0 &&
        typeof item.philosopher?.name === 'string' &&
        axisOrder.every(
          (axis) =>
            typeof item.philosopher.scores?.[axis] === 'number' &&
            Number.isFinite(item.philosopher.scores[axis]) &&
            item.philosopher.scores[axis] >= 0 &&
            item.philosopher.scores[axis] <= 1 &&
            typeof item.philosopher.justifications?.[axis] === 'string',
        ),
    )
  ) {
    throw new Error(
      'We couldn’t read the results. Your answers are still here. Please try again.',
    )
  }
  return data.sort((a, b) => a.distance - b.distance).slice(0, 3)
}

function App() {
  const [page, setPage] = useState<Page>('home')
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [questionIndex, setQuestionIndex] = useState(0)
  const [exampleIndex, setExampleIndex] = useState<number | null>(0)
  const [exampleValues, setExampleValues] = useState(examples[0].values)
  const [exampleTab, setExampleTab] = useState<
    'controls' | 'request' | 'response'
  >('controls')
  const [copied, setCopied] = useState(false)
  const [matches, setMatches] = useState<AssessmentMatch[]>([])
  const [resultProfile, setResultProfile] = useState<AxisProfile | null>(null)
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tryItResult, setTryItResult] = useState<AssessmentMatch[] | null>(null)
  const [tryItLoading, setTryItLoading] = useState(false)
  const [tryItError, setTryItError] = useState('')
  const mainRef = useRef<HTMLElement>(null)
  const previousPage = useRef<Page>('home')
  const question = allQuestions[questionIndex]
  const groupIndex = Math.floor(questionIndex / 3)
  const answered = Object.keys(answers).length
  const profile = buildAxisProfile(questionGroups, answers)
  const selected = matches[selectedMatchIndex]
  const exampleAnswers = Object.fromEntries(
    allQuestions.map((q, i) => [q.id, exampleValues[Math.floor(i / 3)]]),
  )
  const examplePayload = JSON.stringify(
    allQuestions.map((q) => ({
      question_id: q.id,
      score: exampleAnswers[q.id],
    })),
    null,
    2,
  )
  const headings = extractMarkdownHeadings(developerDocs)

  useEffect(() => {
    if (previousPage.current === page) return
    previousPage.current = page
    window.scrollTo({ top: 0, behavior: 'instant' })
    mainRef.current?.focus({ preventScroll: true })
  }, [page])

  useEffect(() => {
    if (page === 'questions') {
      window.scrollTo({ top: 0, behavior: 'instant' })
      document.getElementById('question-title')?.focus({ preventScroll: true })
    }
  }, [questionIndex, page])

  function navigate(next: Page) {
    setPage(next)
  }
  async function submit() {
    if (answered !== allQuestions.length || loading) return
    setLoading(true)
    setError('')
    try {
      const data = await requestAssessment(answers)
      setMatches(data)
      setResultProfile(profile)
      setSelectedMatchIndex(0)
      navigate('response')
    } catch (err) {
      setError(
        err instanceof Error &&
          err.name !== 'TypeError' &&
          err.name !== 'TimeoutError'
          ? err.message
          : 'We couldn’t reach the API. Your answers are still here. Check your connection and try again.',
      )
    } finally {
      setLoading(false)
    }
  }
  async function trySample(customAnswers?: Record<number, number>) {
    setTryItLoading(true)
    setTryItError('')
    setTryItResult(null)
    try {
      setTryItResult(
        await requestAssessment(
          customAnswers ??
            Object.fromEntries(allQuestions.map((q) => [q.id, 0.5])),
        ),
      )
    } catch {
      setTryItError(
        'The sample request couldn’t be completed. Check that the API is running and try again.',
      )
    } finally {
      setTryItLoading(false)
    }
  }

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <button
          className="brand"
          onClick={() => navigate('home')}
          aria-label="René home"
        >
          <span className="brand-symbol" aria-hidden="true">
            r<span>✳</span>
          </span>
          rené<span className="brand-period">.</span>
        </button>
        <span className="brand-note">Philosopher matching API</span>
        <nav aria-label="Primary" className="nav">
          <button
            className={page === 'home' ? 'nav-link active' : 'nav-link'}
            onClick={() => navigate('home')}
          >
            Overview
          </button>
          <button
            className={page === 'docs' ? 'nav-link active' : 'nav-link'}
            onClick={() => navigate('docs')}
          >
            Documentation
          </button>
          {matches.length > 0 && (
            <button
              className={page === 'response' ? 'nav-link active' : 'nav-link'}
              onClick={() => navigate('response')}
            >
              Results
            </button>
          )}
        </nav>
        <button className="header-cta" onClick={() => navigate('questions')}>
          {answered ? 'Continue assessment' : 'Try assessment'} <Arrow />
        </button>
      </header>

      <main id="main" ref={mainRef} tabIndex={-1}>
        {page === 'home' && (
          <div className="api-home view-enter">
            <section className="api-intro">
              <div>
                <p className="eyebrow">RENÉ / REST API</p>
                <h1>
                  Philosophy,
                  <br />
                  <span>in six dimensions.</span>
                </h1>
                <p>
                  Submit 18 answers. Get the closest philosopher profiles,
                  ranked by Euclidean distance.
                </p>
                <div className="hero-actions">
                  <button
                    className="primary-button"
                    onClick={() => navigate('questions')}
                  >
                    Try the assessment <Arrow />
                  </button>
                  <button
                    className="text-button"
                    onClick={() => navigate('docs')}
                  >
                    Read the docs →
                  </button>
                </div>
              </div>
              <div className="api-summary">
                <code>
                  <span>POST</span> /assess
                </code>
                <p>Answers → axis scores → matches</p>
                <ApiFlow running={tryItLoading} />
                <button
                  className="text-button"
                  onClick={() =>
                    document.getElementById('explorer')?.scrollIntoView({
                      behavior: window.matchMedia(
                        '(prefers-reduced-motion: reduce)',
                      ).matches
                        ? 'instant'
                        : 'smooth',
                    })
                  }
                >
                  Explore the model ↓
                </button>
              </div>
            </section>
            <section id="explorer" className="explorer">
              <div className="explorer-header">
                <div>
                  <h2>Explore the model</h2>
                  <p>Adjust a profile to see how the six axes work.</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => {
                    setExampleValues(Array(6).fill(0.5))
                    setExampleIndex(null)
                    setTryItResult(null)
                    setTryItError('')
                  }}
                >
                  Reset to neutral ↺
                </button>
              </div>
              <div className="explorer-grid">
                <div className="explorer-input">
                  <div
                    className="explorer-tabs"
                    role="tablist"
                    aria-label="API explorer"
                  >
                    {(['controls', 'request', 'response'] as const).map((t) => (
                      <button
                        key={t}
                        id={`tab-${t}`}
                        role="tab"
                        aria-selected={exampleTab === t}
                        aria-controls={`panel-${t}`}
                        tabIndex={exampleTab === t ? 0 : -1}
                        onKeyDown={(e) => {
                          const tabs = [
                            'controls',
                            'request',
                            'response',
                          ] as const
                          const index = tabs.indexOf(t)
                          let next = index
                          if (e.key === 'ArrowRight') next = (index + 1) % 3
                          else if (e.key === 'ArrowLeft') next = (index + 2) % 3
                          else if (e.key === 'Home') next = 0
                          else if (e.key === 'End') next = 2
                          else return
                          e.preventDefault()
                          setExampleTab(tabs[next])
                          document.getElementById(`tab-${tabs[next]}`)?.focus()
                        }}
                        onClick={() => setExampleTab(t)}
                      >
                        {t === 'controls'
                          ? 'Profile'
                          : t === 'request'
                            ? 'Request'
                            : 'Response'}
                      </button>
                    ))}
                  </div>
                  <div
                    className="explorer-panel"
                    id={`panel-${exampleTab}`}
                    role="tabpanel"
                    aria-labelledby={`tab-${exampleTab}`}
                  >
                    {exampleTab === 'controls' && (
                      <div className="axis-sliders">
                        {axisOrder.map((axis, i) => (
                          <div className="axis-slider" key={axis}>
                            <div>
                              <label htmlFor={`axis-${axis}`}>
                                {axisLabels[axis]}
                              </label>
                              <output htmlFor={`axis-${axis}`}>
                                {exampleValues[i].toFixed(2)}
                              </output>
                            </div>
                            <input
                              id={`axis-${axis}`}
                              type="range"
                              min="0"
                              max="1"
                              step=".01"
                              value={exampleValues[i]}
                              onChange={(e) => {
                                setExampleValues((current) =>
                                  current.map((v, j) =>
                                    i === j ? Number(e.target.value) : v,
                                  ),
                                )
                                setExampleIndex(null)
                                setTryItResult(null)
                                setTryItError('')
                                setCopied(false)
                              }}
                            />
                            <div className="slider-poles">
                              <span>
                                {questionGroups[i].description.split(' → ')[0]}
                              </span>
                              <span>
                                {questionGroups[i].description.split(' → ')[1]}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {exampleTab === 'request' && (
                      <>
                        <div className="code-toolbar">
                          <span>application/json · 18 answers</span>
                          <button
                            className="text-button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(
                                  examplePayload,
                                )
                                setCopied(true)
                              } catch {
                                setCopied(false)
                              }
                            }}
                          >
                            {copied ? 'Copied' : 'Copy JSON'}
                          </button>
                        </div>
                        <pre className="explorer-code">
                          <code>{examplePayload}</code>
                        </pre>
                      </>
                    )}
                    {exampleTab === 'response' &&
                      (tryItResult ? (
                        <>
                          <p className="response-label">
                            Last request · top {tryItResult.length} matches
                          </p>
                          <pre className="explorer-code">
                            <code>{JSON.stringify(tryItResult, null, 2)}</code>
                          </pre>
                        </>
                      ) : (
                        <div className="response-empty">
                          <ApiFlow running={tryItLoading} />
                          <p>
                            {tryItLoading
                              ? 'Waiting for the API…'
                              : 'Run a request to inspect the response.'}
                          </p>
                        </div>
                      ))}
                  </div>
                  <div className="explorer-run">
                    <button
                      className="primary-button"
                      disabled={tryItLoading}
                      onClick={() => {
                        setExampleTab('response')
                        trySample(exampleAnswers)
                      }}
                    >
                      {tryItLoading ? 'Sending…' : 'Send request'}{' '}
                      <span aria-hidden="true">→</span>
                    </button>
                    <code>POST /assess</code>
                  </div>
                  {tryItError && (
                    <p className="error-note" role="alert">
                      {tryItError}
                    </p>
                  )}
                </div>
                <div className="explorer-map">
                  <div className="figure-heading">
                    <span>
                      {exampleIndex === null
                        ? 'CUSTOM PROFILE'
                        : examples[exampleIndex].name.toUpperCase()}
                    </span>
                    <span>0 — 1</span>
                  </div>
                  <ThoughtMap
                    values={exampleValues}
                    label="Interactive six-axis profile; adjust values using the labeled sliders"
                  />
                  <div className="profile-presets">
                    <span>Load a profile</span>
                    {examples.map((item, i) => (
                      <button
                        key={item.name}
                        aria-pressed={exampleIndex === i}
                        onClick={() => {
                          setExampleIndex(i)
                          setExampleValues(item.values)
                          setTryItResult(null)
                          setTryItError('')
                          setCopied(false)
                        }}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <p className="explorer-note">
                Each slider sets all three answers for that axis. Philosopher
                profiles are interpretive; distance measures similarity, not
                certainty.
              </p>
            </section>
          </div>
        )}

        {page === 'questions' && (
          <section className="assessment view-enter" aria-busy={loading}>
            <div className="assessment-top">
              <button className="text-button" onClick={() => navigate('home')}>
                ← Overview
              </button>
              <span className="eyebrow">ASSESSMENT</span>
              <span className="mono">
                {String(answered).padStart(2, '0')} / 18 ANSWERED
              </span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Questions answered"
              aria-valuenow={answered}
              aria-valuemin={0}
              aria-valuemax={18}
            >
              <span style={{ width: `${(answered / 18) * 100}%` }} />
            </div>
            <div className="assessment-layout">
              <aside className="assessment-aside">
                <p className="eyebrow">AXES</p>
                <ol className="chapter-list">
                  {questionGroups.map((group, i) => (
                    <li
                      key={group.axis}
                      className={i === groupIndex ? 'current' : ''}
                    >
                      <button
                        onClick={() => {
                          setQuestionIndex(i * 3)
                          setError('')
                        }}
                        disabled={loading}
                        aria-current={i === groupIndex ? 'step' : undefined}
                      >
                        <span>0{i + 1}</span>
                        {axisLabels[axisOrder[i]]}
                        <span className="chapter-count">
                          {
                            group.questions.filter(
                              (q) => answers[q.id] !== undefined,
                            ).length
                          }
                          /3
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
                <ThoughtMap
                  values={axisOrder.map((a) => profile[a])}
                  activeAxis={groupIndex}
                  label="Your developing worldview; unanswered axes are provisionally centered"
                />
                <p className="map-note">
                  Unanswered statements count as neutral in this preview.
                </p>
              </aside>
              <div className="question-area">
                <div className="question-topline">
                  <span className="eyebrow">{question.axis}</span>
                  <span className="mono">
                    STATEMENT {String(questionIndex + 1).padStart(2, '0')} / 18
                  </span>
                </div>
                <p className="question-context">{axisPrompts[groupIndex]}</p>
                <fieldset key={question.id} className="question-fieldset">
                  <legend id="question-title" tabIndex={-1}>
                    {question.text}
                  </legend>
                  <p className="answer-prompt">How much do you agree?</p>
                  <div className="answer-options">
                    {scale.map((option, i) => (
                      <label
                        key={option.value}
                        className={
                          answers[question.id] === option.value
                            ? 'answer-option selected'
                            : 'answer-option'
                        }
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          checked={answers[question.id] === option.value}
                          onChange={() => {
                            setAnswers((current) => ({
                              ...current,
                              [question.id]: option.value,
                            }))
                            setError('')
                          }}
                          disabled={loading}
                        />
                        <span className="option-glyph" aria-hidden="true">
                          {['−−', '−', '·', '+', '++'][i]}
                        </span>
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="question-actions">
                  <button
                    className="secondary-button"
                    disabled={questionIndex === 0 || loading}
                    onClick={() => {
                      setQuestionIndex((i) => i - 1)
                      setError('')
                    }}
                  >
                    ← Previous
                  </button>
                  {questionIndex < 17 ? (
                    <button
                      className="primary-button"
                      disabled={answers[question.id] === undefined || loading}
                      onClick={() => setQuestionIndex((i) => i + 1)}
                    >
                      Next statement <span aria-hidden="true">→</span>
                    </button>
                  ) : (
                    <button
                      className="primary-button"
                      disabled={answered < 18 || loading}
                      onClick={submit}
                    >
                      {loading ? 'Calculating…' : 'Get matches'} <Arrow />
                    </button>
                  )}
                </div>
                {questionIndex === 17 && answered < 18 && (
                  <p className="form-note">
                    {18 - answered} statements remain unanswered.{' '}
                    <button
                      className="text-button"
                      onClick={() =>
                        setQuestionIndex(
                          allQuestions.findIndex(
                            (q) => answers[q.id] === undefined,
                          ),
                        )
                      }
                    >
                      Go to the first unanswered →
                    </button>
                  </p>
                )}
                {error && (
                  <div className="error-note" role="alert">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {page === 'response' && (
          <section className="report view-enter">
            {!selected || !resultProfile ? (
              <div className="empty-state">
                <p className="eyebrow">NO RESULTS</p>
                <h1>No matches yet.</h1>
                <p>Complete the assessment to compare your profile.</p>
                <button
                  className="primary-button"
                  onClick={() => navigate('questions')}
                >
                  Start assessment <Arrow />
                </button>
              </div>
            ) : (
              <>
                <div className="report-heading">
                  <div>
                    <p className="eyebrow">ASSESSMENT / RESULTS</p>
                    <h1>Closest matches</h1>
                    <p>Ranked by distance across six axes. Lower is closer.</p>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={() => navigate('questions')}
                  >
                    Edit answers ↗
                  </button>
                </div>
                <div
                  className="match-tabs"
                  aria-label="Your closest philosophers"
                >
                  {matches.map((match, i) => (
                    <button
                      key={match.philosopher.name}
                      className={
                        selectedMatchIndex === i
                          ? 'match-tab active'
                          : 'match-tab'
                      }
                      aria-pressed={selectedMatchIndex === i}
                      onClick={() => setSelectedMatchIndex(i)}
                    >
                      <span className="eyebrow">
                        0{i + 1} / {i === 0 ? 'CLOSEST MATCH' : 'MATCH'}
                      </span>
                      <PhilosopherPortrait name={match.philosopher.name} />
                      <strong>{match.philosopher.name}</strong>
                      <span className="match-distance">
                        Distance {match.distance.toFixed(3)}{' '}
                        <span aria-hidden="true">↗</span>
                      </span>
                    </button>
                  ))}
                </div>
                <div className="report-body">
                  <aside className="report-map">
                    <p className="eyebrow">PROFILE COMPARISON</p>
                    <ThoughtMap
                      values={axisOrder.map((a) => resultProfile[a])}
                      comparison={axisOrder.map(
                        (a) => selected.philosopher.scores[a],
                      )}
                      label={`Your profile in solid cobalt compared with ${selected.philosopher.name} in dashed graphite`}
                    />
                    <div className="map-legend">
                      <span>
                        <i /> You
                      </span>
                      <span>
                        <i /> {selected.philosopher.name}
                      </span>
                    </div>
                    <p>
                      Closer shapes suggest closer perspectives. A lower
                      distance means greater similarity across the six axes.
                    </p>
                  </aside>
                  <div className="axis-comparisons">
                    <div className="comparison-heading">
                      <h2>Axis comparison</h2>
                      <p>Select an axis to read the scoring rationale.</p>
                    </div>
                    {axisOrder.map((axis, i) => (
                      <details
                        key={`${selectedMatchIndex}-${axis}`}
                        className="axis-detail"
                      >
                        <summary>
                          <span className="axis-detail-number">0{i + 1}</span>
                          <span>{axisLabels[axis]}</span>
                          <span className="axis-values">
                            You {resultProfile[axis].toFixed(2)} <span>/</span>{' '}
                            {selected.philosopher.scores[axis].toFixed(2)}
                          </span>
                          <span className="detail-plus" aria-hidden="true">
                            +
                          </span>
                        </summary>
                        <div className="axis-detail-body">
                          <div className="comparison-track">
                            <i
                              style={{ left: `${resultProfile[axis] * 100}%` }}
                            />
                            <b
                              style={{
                                left: `${selected.philosopher.scores[axis] * 100}%`,
                              }}
                            />
                          </div>
                          <div className="axis-poles">
                            <span>
                              {questionGroups[i].description.split(' → ')[0]}
                            </span>
                            <span>
                              {questionGroups[i].description.split(' → ')[1]}
                            </span>
                          </div>
                          <p>{selected.philosopher.justifications[axis]}</p>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {page === 'docs' && (
          <section className="docs-page view-enter">
            <div className="report-heading">
              <div>
                <p className="eyebrow">RENÉ / DOCUMENTATION</p>
                <h1>API reference</h1>
                <p>Request format, scoring, and local setup.</p>
              </div>
            </div>
            <div className="docs-layout">
              <aside className="docs-sidebar">
                <p className="eyebrow">CONTENTS</p>
                <nav aria-label="Documentation contents">
                  {headings.map((h) => (
                    <a key={h.id} href={`#${h.id}`}>
                      {h.text}
                    </a>
                  ))}
                  <a href="#api-playground">Try the API</a>
                </nav>
              </aside>
              <article className="docs-article">
                <MarkdownDocument markdown={developerDocs} />
                <section id="api-playground" className="api-playground">
                  <p className="eyebrow">LIVE EXAMPLE</p>
                  <h2>Send a neutral profile.</h2>
                  <p>
                    Send all 18 answers at 0.5 and inspect the top three matches
                    returned by the live API.
                  </p>
                  <code className="endpoint">POST {assessRequestUrl}</code>
                  <button
                    className="primary-button"
                    disabled={tryItLoading}
                    onClick={() => trySample()}
                  >
                    {tryItLoading ? 'Sending request…' : 'Run sample request'}{' '}
                    <Arrow />
                  </button>
                  {tryItError && (
                    <p className="error-note" role="alert">
                      {tryItError}
                    </p>
                  )}
                  {tryItResult && (
                    <div role="status">
                      <p>Request complete. Top {tryItResult.length} matches:</p>
                      <pre className="doc-code-block">
                        <code>{JSON.stringify(tryItResult, null, 2)}</code>
                      </pre>
                    </div>
                  )}
                </section>
              </article>
            </div>
          </section>
        )}
      </main>
      <footer className="footer">
        <button className="footer-brand" onClick={() => navigate('home')}>
          rené.
        </button>
        <span>Philosopher matching API</span>
        <button className="text-button" onClick={() => navigate('docs')}>
          Documentation <Arrow />
        </button>
      </footer>
    </div>
  )
}

export default App
