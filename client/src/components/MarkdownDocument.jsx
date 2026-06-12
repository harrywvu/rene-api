const HEADING_RE = /^(#{1,6})\s+(.*)$/
const BULLET_RE = /^[-*]\s+(.*)$/
const ORDERED_RE = /^\d+\.\s+(.*)$/
const BLOCKQUOTE_RE = /^>\s?(.*)$/

function slugify(value) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  )
}

function renderInline(text) {
  const nodes = []
  const pattern = /`([^`]+)`/g
  let cursor = 0
  let match

  while ((match = pattern.exec(text))) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index))
    }

    nodes.push(
      <code key={`code-${match.index}`} className="doc-inline-code">
        {match[1]}
      </code>,
    )
    cursor = match.index + match[0].length
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor))
  }

  return nodes
}

function parseMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  const headings = []
  let index = 0

  while (index < lines.length) {
    const rawLine = lines[index]
    const line = rawLine.trimEnd()
    const trimmed = line.trim()

    if (!trimmed) {
      index += 1
      continue
    }

    const headingMatch = line.match(HEADING_RE)
    if (headingMatch) {
      const level = headingMatch[1].length
      const text = headingMatch[2].trim()
      const id = slugify(text)
      headings.push({ id, level, text })
      blocks.push({ id, level, text, type: 'heading' })
      index += 1
      continue
    }

    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim()
      const codeLines = []
      index += 1

      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index])
        index += 1
      }

      if (index < lines.length) {
        index += 1
      }

      blocks.push({ code: codeLines.join('\n'), lang, type: 'code' })
      continue
    }

    if (/^---+$/.test(trimmed)) {
      blocks.push({ type: 'hr' })
      index += 1
      continue
    }

    if (BULLET_RE.test(line)) {
      const items = []
      while (index < lines.length && BULLET_RE.test(lines[index])) {
        items.push(lines[index].replace(BULLET_RE, '$1'))
        index += 1
      }
      blocks.push({ items, type: 'ul' })
      continue
    }

    if (ORDERED_RE.test(line)) {
      const items = []
      while (index < lines.length && ORDERED_RE.test(lines[index])) {
        items.push(lines[index].replace(ORDERED_RE, '$1'))
        index += 1
      }
      blocks.push({ items, type: 'ol' })
      continue
    }

    if (BLOCKQUOTE_RE.test(line)) {
      const quoteLines = []
      while (index < lines.length && BLOCKQUOTE_RE.test(lines[index])) {
        quoteLines.push(lines[index].replace(BLOCKQUOTE_RE, '$1'))
        index += 1
      }
      blocks.push({ text: quoteLines.join(' '), type: 'blockquote' })
      continue
    }

    const paragraphLines = [trimmed]
    index += 1

    while (
      index < lines.length &&
      lines[index].trim() &&
      !HEADING_RE.test(lines[index]) &&
      !lines[index].trim().startsWith('```') &&
      !BULLET_RE.test(lines[index]) &&
      !ORDERED_RE.test(lines[index]) &&
      !BLOCKQUOTE_RE.test(lines[index]) &&
      !/^---+$/.test(lines[index].trim())
    ) {
      paragraphLines.push(lines[index].trim())
      index += 1
    }

    blocks.push({ text: paragraphLines.join(' '), type: 'paragraph' })
  }

  return { blocks, headings }
}

export function extractMarkdownHeadings(markdown) {
  return parseMarkdown(markdown).headings.filter((heading) => heading.level > 1)
}

export default function MarkdownDocument({ markdown }) {
  const { blocks } = parseMarkdown(markdown)

  return (
    <div className="markdown-doc">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const Tag = `h${Math.min(block.level, 6)}`
          return (
            <Tag key={`${block.id}-${index}`} id={block.id} className="doc-heading">
              {block.text}
            </Tag>
          )
        }

        if (block.type === 'code') {
          return (
            <pre key={`code-${index}`} className="doc-code-block">
              <code>{block.code}</code>
            </pre>
          )
        }

        if (block.type === 'ul') {
          return (
            <ul key={`ul-${index}`} className="doc-list">
              {block.items.map((item, itemIndex) => (
                <li key={`${index}-${itemIndex}`}>{renderInline(item)}</li>
              ))}
            </ul>
          )
        }

        if (block.type === 'ol') {
          return (
            <ol key={`ol-${index}`} className="doc-list doc-list-ordered">
              {block.items.map((item, itemIndex) => (
                <li key={`${index}-${itemIndex}`}>{renderInline(item)}</li>
              ))}
            </ol>
          )
        }

        if (block.type === 'blockquote') {
          return (
            <blockquote key={`blockquote-${index}`} className="doc-callout">
              <p>{renderInline(block.text)}</p>
            </blockquote>
          )
        }

        if (block.type === 'hr') {
          return <hr key={`hr-${index}`} className="doc-divider" />
        }

        return (
          <p key={`paragraph-${index}`} className="doc-paragraph">
            {renderInline(block.text)}
          </p>
        )
      })}
    </div>
  )
}
