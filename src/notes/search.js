export function findMatch(content, query) {
  const text = content || ''
  const needle = (query || '').trim()
  if (!needle) return null
  const index = text.toLowerCase().indexOf(needle.toLowerCase())
  if (index === -1) return null
  return {
    start: index,
    end: index + needle.length,
    lineNumber: text.slice(0, index).split('\n').length,
  }
}

export function searchNotes(notes, query) {
  const needle = (query || '').trim()
  if (!needle) return []

  const results = []
  for (const note of notes) {
    if ((note.title || '').toLowerCase().includes(needle.toLowerCase())) {
      results.push({
        id: note.id,
        title: note.title || 'Untitled Note',
        field: 'title',
        preview: note.title || 'Untitled Note',
        start: 0,
        end: 0,
        lineNumber: 1,
      })
      continue
    }
    const match = findMatch(note.content, needle)
    if (match) {
      const line = (note.content || '').split('\n')[match.lineNumber - 1] || ''
      results.push({
        id: note.id,
        title: note.title || 'Untitled Note',
        field: 'body',
        preview: line.trim(),
        ...match,
      })
    }
  }
  return results
}
