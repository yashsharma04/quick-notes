import React, { useEffect, useRef, useState } from 'react'
import { coffeeCheckoutPath } from './polar/config.js'
import { collectTags, sortNotes } from './notes/model.js'
import { NOTE_TEMPLATES } from './notes/templates.js'

const Sidebar = ({
  notes,
  activeNoteId,
  tagFilter,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onOpenFolder,
  onRenameNote,
  onTogglePin,
  onSearch,
  onBackup,
  onRestore,
  onTagFilter,
  isLocalMode,
  dirName,
}) => {
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const restoreRef = useRef(null)
  const templateRef = useRef(null)

  useEffect(() => {
    if (!showTemplates) return undefined
    const close = (event) => {
      if (!templateRef.current?.contains(event.target)) {
        setShowTemplates(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [showTemplates])

  const tags = collectTags(notes)
  const visibleNotes = sortNotes(
    tagFilter
      ? notes.filter((note) => (note.tags || []).some((tag) => tag.toLowerCase() === tagFilter.toLowerCase()))
      : notes,
  )
  const browserNotes = visibleNotes.filter((note) => !note.fileHandle)
  const localNotes = visibleNotes.filter((note) => note.fileHandle)

  const startRename = (event, note) => {
    event.stopPropagation()
    setRenamingId(note.id)
    setRenameValue(note.title || '')
  }

  const commitRename = (noteId) => {
    const title = renameValue.trim() || 'Untitled Note'
    onRenameNote(noteId, title)
    setRenamingId(null)
  }

  const renderNoteList = (notesList, title) => {
    if (notesList.length === 0) return null
    return (
      <div className="notes-section">
        <h3 className="notes-section-title">{title}</h3>
        {notesList.map((note) => (
          <div
            key={note.id}
            className={`note-item ${note.id === activeNoteId ? 'active' : ''} ${note.pinned ? 'pinned' : ''}`}
            onClick={() => onSelectNote(note.id)}
          >
            <div className="note-item-content">
              {renamingId === note.id ? (
                <input
                  className="note-rename-input"
                  value={renameValue}
                  autoFocus
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => setRenameValue(event.target.value)}
                  onBlur={() => commitRename(note.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') commitRename(note.id)
                    if (event.key === 'Escape') setRenamingId(null)
                  }}
                />
              ) : (
                <h3
                  className="note-title"
                  onDoubleClick={(event) => startRename(event, note)}
                  title="Double-click to rename"
                >
                  {note.pinned ? '★ ' : ''}
                  {note.title || 'Untitled Note'}
                </h3>
              )}
              <p className="note-preview">
                {note.content ? note.content.substring(0, 50) : 'No content'}
              </p>
              <span className="note-date">
                {new Date(note.lastModified).toLocaleDateString()}
                {(note.tags || []).length > 0 ? ` · ${note.tags.join(', ')}` : ''}
              </span>
            </div>
            <div className="note-item-actions">
              <button
                className={`pin-note-btn ${note.pinned ? 'active' : ''}`}
                onClick={(event) => {
                  event.stopPropagation()
                  onTogglePin(note.id)
                }}
                title={note.pinned ? 'Unpin note' : 'Pin note'}
              >
                ★
              </button>
              <button
                className="delete-note-btn"
                onClick={(event) => {
                  event.stopPropagation()
                  onDeleteNote(note.id)
                }}
                title="Delete note"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title-section">
          <h2 className="sidebar-title">Notes</h2>
          {isLocalMode && <span className="local-badge" title={dirName}>📂 {dirName}</span>}
        </div>
        <div className="sidebar-actions">
          <button className="icon-btn" onClick={onSearch} title="Search notes (Cmd/Ctrl+K)">
            <span className="btn-icon">⌕</span>
          </button>
          <button className="icon-btn" onClick={onOpenFolder} title="Open Local Folder">
            <span className="btn-icon">📂</span>
          </button>
          <div className="template-menu" ref={templateRef}>
            <button
              className="icon-btn new-note-btn"
              onClick={() => setShowTemplates((open) => !open)}
              title="Create new note"
            >
              <span className="btn-icon">+</span>
            </button>
            {showTemplates && (
              <div className="template-dropdown">
                {NOTE_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    className="template-option"
                    onClick={() => {
                      onCreateNote(template.id)
                      setShowTemplates(false)
                    }}
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="tag-filter" role="tablist" aria-label="Filter by tag">
        <button
          className={`tag-chip ${!tagFilter ? 'active' : ''}`}
          onClick={() => onTagFilter(null)}
        >
          All
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            className={`tag-chip ${tagFilter === tag ? 'active' : ''}`}
            onClick={() => onTagFilter(tagFilter === tag ? null : tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="notes-list">
        {renderNoteList(browserNotes, 'Browser Notes')}
        {renderNoteList(localNotes, 'Local Notes')}

        {visibleNotes.length === 0 && (
          <div className="empty-notes">
            <p>{notes.length === 0 ? 'No notes yet' : 'No notes with this tag'}</p>
            <button onClick={() => onCreateNote('blank')} className="create-first-note-btn">Create one</button>
          </div>
        )}
      </div>

      <div className="storage-panel">
        <p className="storage-warning">
          Browser notes disappear if you clear site data. Open a folder to keep files on disk, or download a backup.
        </p>
        <div className="storage-actions">
          <button className="storage-btn" onClick={onBackup}>Backup zip</button>
          <button className="storage-btn" onClick={() => restoreRef.current?.click()}>Restore zip</button>
          <input
            ref={restoreRef}
            type="file"
            accept=".zip,application/zip"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onRestore(file)
              event.target.value = ''
            }}
          />
        </div>
      </div>

      <a className="coffee-link" href={coffeeCheckoutPath()}>
        Buy me a coffee
      </a>
    </aside>
  )
}

export default Sidebar
