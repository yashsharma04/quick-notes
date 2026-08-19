import { normalizeNote } from './model.js'

function sanitizeFilename(title) {
  const cleaned = (title || 'Untitled Note')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
  return cleaned || 'Untitled Note'
}

export function serializeMarkdownBackup(note) {
  const tags = (note.tags || []).join(', ')
  return [
    '---',
    `id: ${JSON.stringify(note.id)}`,
    `title: ${JSON.stringify(note.title || 'Untitled Note')}`,
    `pinned: ${note.pinned ? 'true' : 'false'}`,
    `tags: ${JSON.stringify(tags ? (note.tags || []) : [])}`,
    `lastModified: ${Number(note.lastModified) || Date.now()}`,
    '---',
    '',
    note.content || '',
  ].join('\n')
}

export function parseMarkdownBackup(filename, markdown) {
  const text = markdown || ''
  const fence = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!fence) {
    const title = filename.replace(/\.md$/i, '') || 'Untitled Note'
    return normalizeNote({
      id: `${Date.now()}-${title}`,
      title,
      content: text,
    })
  }

  const meta = {}
  for (const line of fence[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
  }

  let tags = []
  try {
    const parsed = JSON.parse(meta.tags || '[]')
    if (Array.isArray(parsed)) tags = parsed
  } catch {
    tags = []
  }

  let title = filename.replace(/\.md$/i, '')
  try {
    title = JSON.parse(meta.title)
  } catch {
    title = meta.title || title
  }

  let id = `${Date.now()}-${title}`
  try {
    id = JSON.parse(meta.id)
  } catch {
    id = meta.id || id
  }

  return normalizeNote({
    id,
    title,
    content: fence[2].replace(/^\n/, ''),
    pinned: meta.pinned === 'true',
    tags,
    lastModified: Number(meta.lastModified) || Date.now(),
  })
}

export function notesToBackupFiles(notes) {
  const used = new Set()
  const files = []
  for (const note of notes) {
    if (note.fileHandle) continue
    const base = sanitizeFilename(note.title)
    let name = `${base}.md`
    let n = 2
    while (used.has(name.toLowerCase())) {
      name = `${base}-${n}.md`
      n += 1
    }
    used.add(name.toLowerCase())
    files.push({ name, content: serializeMarkdownBackup(normalizeNote(note)) })
  }
  return files
}

export function notesFromBackupFiles(files) {
  return files
    .filter((file) => file.name.toLowerCase().endsWith('.md'))
    .map((file) => parseMarkdownBackup(file.name, file.content))
}
