function text(value) {
  return { type: 'text', text: String(value || '') }
}

function element(name, className, children, attrs) {
  return {
    name,
    attrs: Object.assign(className ? { class: className } : {}, attrs || {}),
    children: children || [],
  }
}

function findClosing(source, marker, from) {
  const index = source.indexOf(marker, from)
  return index > from ? index : -1
}

function parseInline(source) {
  const value = String(source || '')
  const nodes = []
  let plain = ''
  let index = 0

  function flush() {
    if (!plain) return
    nodes.push(text(plain))
    plain = ''
  }

  while (index < value.length) {
    const char = value[index]

    if (char === '\\' && index + 1 < value.length) {
      plain += value[index + 1]
      index += 2
      continue
    }

    if (char === '\n') {
      flush()
      nodes.push(element('br'))
      index += 1
      continue
    }

    if (char === '`') {
      const end = findClosing(value, '`', index + 1)
      if (end >= 0) {
        flush()
        nodes.push(element('code', 'md-inline-code', [text(value.slice(index + 1, end))]))
        index = end + 1
        continue
      }
    }

    const strongMarker = value.slice(index, index + 2)
    if (strongMarker === '**' || strongMarker === '__') {
      const end = findClosing(value, strongMarker, index + 2)
      if (end >= 0) {
        flush()
        nodes.push(element('strong', 'md-strong', parseInline(value.slice(index + 2, end))))
        index = end + 2
        continue
      }
    }

    if (value.slice(index, index + 2) === '~~') {
      const end = findClosing(value, '~~', index + 2)
      if (end >= 0) {
        flush()
        nodes.push(element('del', 'md-del', parseInline(value.slice(index + 2, end))))
        index = end + 2
        continue
      }
    }

    if (char === '*' || char === '_') {
      const end = findClosing(value, char, index + 1)
      if (end >= 0) {
        flush()
        nodes.push(element('em', 'md-em', parseInline(value.slice(index + 1, end))))
        index = end + 1
        continue
      }
    }

    if (char === '[') {
      const labelEnd = value.indexOf('](', index + 1)
      const urlEnd = labelEnd >= 0 ? value.indexOf(')', labelEnd + 2) : -1
      if (labelEnd > index + 1 && urlEnd > labelEnd + 2) {
        const url = value.slice(labelEnd + 2, urlEnd).trim()
        if (/^https?:\/\//i.test(url)) {
          flush()
          nodes.push(element('a', 'md-link', parseInline(value.slice(index + 1, labelEnd)), { href: url }))
          index = urlEnd + 1
          continue
        }
      }
    }

    plain += char
    index += 1
  }

  flush()
  return nodes
}

function isDivider(line) {
  return /^\s{0,3}((\*\s*){3,}|(-\s*){3,}|(_\s*){3,})\s*$/.test(line)
}

function isTableDivider(line) {
  const cells = splitTableRow(line)
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()))
}

function splitTableRow(line) {
  let source = String(line || '').trim()
  if (source[0] === '|') source = source.slice(1)
  if (source[source.length - 1] === '|') source = source.slice(0, -1)
  const cells = []
  let cell = ''
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === '\\' && source[index + 1] === '|') {
      cell += '|'
      index += 1
    } else if (source[index] === '|') {
      cells.push(cell.trim())
      cell = ''
    } else {
      cell += source[index]
    }
  }
  cells.push(cell.trim())
  return cells
}

function startsBlock(lines, index) {
  const line = lines[index] || ''
  const next = lines[index + 1] || ''
  return /^\s*```/.test(line)
    || /^\s{0,3}#{1,6}\s+/.test(line)
    || /^\s{0,3}>\s?/.test(line)
    || /^\s*[-+*]\s+/.test(line)
    || /^\s*\d+[.)]\s+/.test(line)
    || isDivider(line)
    || (line.indexOf('|') >= 0 && isTableDivider(next))
}

function parseTable(lines, index) {
  const headers = splitTableRow(lines[index])
  const rows = []
  let cursor = index + 2
  while (cursor < lines.length && lines[cursor].trim() && lines[cursor].indexOf('|') >= 0) {
    rows.push(splitTableRow(lines[cursor]))
    cursor += 1
  }

  const head = element('tr', 'md-tr', headers.map((cell) => (
    element('th', 'md-th', parseInline(cell))
  )))
  const body = rows.map((row) => element('tr', 'md-tr', headers.map((unused, cellIndex) => (
    element('td', 'md-td', parseInline(row[cellIndex] || ''))
  ))))

  return {
    node: element('table', 'md-table', [
      element('thead', 'md-thead', [head]),
      element('tbody', 'md-tbody', body),
    ]),
    next: cursor,
  }
}

function parseBlocks(source) {
  const lines = String(source || '').replace(/\r\n?/g, '\n').split('\n')
  const nodes = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) {
      index += 1
      continue
    }

    const fence = line.match(/^\s*```\s*([\w+-]*)\s*$/)
    if (fence) {
      const code = []
      index += 1
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
        code.push(lines[index])
        index += 1
      }
      if (index < lines.length) index += 1
      const attrs = fence[1] ? { 'data-language': fence[1] } : null
      nodes.push(element('pre', 'md-pre', [element('code', 'md-code', [text(code.join('\n'))], attrs)]))
      continue
    }

    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*$/)
    if (heading) {
      const level = heading[1].length
      nodes.push(element('h' + level, 'md-heading md-h' + level, parseInline(heading[2])))
      index += 1
      continue
    }

    if (isDivider(line)) {
      nodes.push(element('hr', 'md-hr'))
      index += 1
      continue
    }

    if (line.indexOf('|') >= 0 && isTableDivider(lines[index + 1] || '')) {
      const table = parseTable(lines, index)
      nodes.push(table.node)
      index = table.next
      continue
    }

    if (/^\s{0,3}>\s?/.test(line)) {
      const quoted = []
      while (index < lines.length && /^\s{0,3}>\s?/.test(lines[index])) {
        quoted.push(lines[index].replace(/^\s{0,3}>\s?/, ''))
        index += 1
      }
      nodes.push(element('blockquote', 'md-quote', parseBlocks(quoted.join('\n'))))
      continue
    }

    const unordered = line.match(/^\s*[-+*]\s+(.+)$/)
    if (unordered) {
      const items = []
      while (index < lines.length) {
        const match = lines[index].match(/^\s*[-+*]\s+(.+)$/)
        if (!match) break
        items.push(element('li', 'md-li', parseInline(match[1])))
        index += 1
      }
      nodes.push(element('ul', 'md-list md-ul', items))
      continue
    }

    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/)
    if (ordered) {
      const items = []
      while (index < lines.length) {
        const match = lines[index].match(/^\s*\d+[.)]\s+(.+)$/)
        if (!match) break
        items.push(element('li', 'md-li', parseInline(match[1])))
        index += 1
      }
      nodes.push(element('ol', 'md-list md-ol', items))
      continue
    }

    const paragraph = [line.trim()]
    index += 1
    while (index < lines.length && lines[index].trim() && !startsBlock(lines, index)) {
      paragraph.push(lines[index].trim())
      index += 1
    }
    nodes.push(element('p', 'md-p', parseInline(paragraph.join('\n'))))
  }

  return nodes
}

module.exports = {
  parse: parseBlocks,
}
