import { useEffect, useRef, useState } from 'react'
import { searchNotes } from './notes/search.js'

export default function SearchPalette({ notes, isOpen, onClose, onJump }) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const results = searchNotes(notes, query)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setActiveIndex(0)
      inputRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  if (!isOpen) return null

  const choose = (result) => {
    if (!result) return
    onJump(result)
    onClose()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(results[activeIndex])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }

  return (
    <div className="modal-overlay search-overlay" onClick={onClose}>
      <div
        className="search-palette"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search notes"
      >
        <input
          ref={inputRef}
          className="search-palette-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search notes…"
        />
        <div className="search-palette-results">
          {query.trim() && results.length === 0 && (
            <p className="search-palette-empty">No matching notes</p>
          )}
          {results.map((result, index) => (
            <button
              key={`${result.id}-${result.field}-${result.start}`}
              className={`search-palette-item ${index === activeIndex ? 'active' : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(result)}
            >
              <span className="search-palette-title">{result.title}</span>
              <span className="search-palette-meta">
                {result.field === 'title' ? 'Title' : `Line ${result.lineNumber}`}
                {result.field === 'body' && result.preview ? ` · ${result.preview}` : ''}
              </span>
            </button>
          ))}
        </div>
        <p className="search-palette-hint">↑↓ to move · Enter to jump · Esc to close</p>
      </div>
    </div>
  )
}
