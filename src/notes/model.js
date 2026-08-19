export const DEFAULT_TAGS = ['Work', 'Meetings']

export function normalizeNote(note) {
  const tags = Array.isArray(note.tags)
    ? note.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : []
  return {
    ...note,
    title: note.title?.trim() ? note.title : 'Untitled Note',
    content: note.content || '',
    pinned: Boolean(note.pinned),
    tags,
    lastModified: note.lastModified || Date.now(),
  }
}

export function withContentChange(note, content) {
  return {
    ...note,
    content,
    lastModified: Date.now(),
  }
}

export function sortNotes(notes) {
  return [...notes].sort((a, b) => {
    const pin = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))
    if (pin !== 0) return pin
    return (b.lastModified || 0) - (a.lastModified || 0)
  })
}

export function collectTags(notes) {
  const seen = new Map()
  for (const tag of DEFAULT_TAGS) {
    seen.set(tag.toLowerCase(), tag)
  }
  for (const note of notes) {
    for (const tag of note.tags || []) {
      const key = tag.toLowerCase()
      if (!seen.has(key)) seen.set(key, tag)
    }
  }
  return [...seen.values()]
}

export function toggleTag(note, tag) {
  const current = note.tags || []
  const exists = current.some((item) => item.toLowerCase() === tag.toLowerCase())
  const tags = exists
    ? current.filter((item) => item.toLowerCase() !== tag.toLowerCase())
    : [...current, tag]
  return { ...note, tags, lastModified: Date.now() }
}

export function mergeRestoredNotes(existing, restored) {
  const byId = new Map(existing.map((note) => [note.id, note]))
  for (const note of restored) {
    const normalized = normalizeNote(note)
    const previous = byId.get(normalized.id)
    if (previous?.fileHandle) continue
    byId.set(normalized.id, { ...previous, ...normalized, fileHandle: undefined })
  }
  return sortNotes([...byId.values()])
}
