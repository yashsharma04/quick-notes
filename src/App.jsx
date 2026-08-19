import { useState, useEffect, useRef } from 'react'
import Sidebar from './Sidebar'
import ConfirmationModal from './ConfirmationModal'
import SearchPalette from './SearchPalette'
import {
  openDirectory,
  readNotesFromDirectory,
  saveNoteToFile,
  deleteNoteFile
} from './FileSystemManager'
import {
  collectTags,
  mergeRestoredNotes,
  normalizeNote,
  sortNotes,
  toggleTag,
  withContentChange
} from './notes/model.js'
import { applyTemplate } from './notes/templates.js'
import { unzipBrowserNotes, zipBrowserNotes } from './notes/zip.js'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './App.css'

const FILE_META_KEY = 'quickNoteFileMeta'

function loadFileMeta() {
  try {
    return JSON.parse(localStorage.getItem(FILE_META_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveFileMetaForNotes(notes) {
  const meta = {}
  for (const note of notes) {
    if (!note.fileHandle) continue
    meta[note.id] = {
      title: note.title,
      pinned: note.pinned,
      tags: note.tags || [],
    }
  }
  localStorage.setItem(FILE_META_KEY, JSON.stringify(meta))
}

function mergeFolderNotes(folderNotes, meta) {
  return folderNotes.map((note) => normalizeNote({
    ...note,
    ...(meta[note.id] || {}),
    fileHandle: note.fileHandle,
    id: note.id,
    content: note.content,
  }))
}

function App() {
  const [notes, setNotes] = useState([])
  const [activeNoteId, setActiveNoteId] = useState(null)
  const [lastSaved, setLastSaved] = useState(null)
  const [justSaved, setJustSaved] = useState(false)
  const [showMilestone, setShowMilestone] = useState(false)
  const [milestoneText, setMilestoneText] = useState('')
  const [fontSize, setFontSize] = useState('medium')
  const [focusMode, setFocusMode] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [tagFilter, setTagFilter] = useState(null)
  const [jumpTo, setJumpTo] = useState(null)
  const [tagDraft, setTagDraft] = useState('')

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState(null)

  const [isLocalMode, setIsLocalMode] = useState(false)
  const [dirHandle, setDirHandle] = useState(null)

  const textareaRef = useRef(null)

  useEffect(() => {
    const savedFontSize = localStorage.getItem('quickNoteFontSize')
    if (savedFontSize) {
      setFontSize(savedFontSize)
    }

    const savedNotes = JSON.parse(localStorage.getItem('quickNotes') || '[]')
    const oldContent = localStorage.getItem('quickNoteContent')

    if (savedNotes.length > 0) {
      const normalized = sortNotes(savedNotes.map(normalizeNote))
      setNotes(normalized)
      setActiveNoteId(normalized[0].id)
    } else if (oldContent) {
      const newNote = normalizeNote({
        id: Date.now().toString(),
        title: oldContent.split('\n')[0] || 'Untitled Note',
        content: oldContent,
        lastModified: Date.now()
      })
      setNotes([newNote])
      setActiveNoteId(newNote.id)
      localStorage.setItem('quickNotes', JSON.stringify([newNote]))
    } else {
      createNewNote('blank')
    }

    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    localStorage.setItem('quickNoteFontSize', fontSize)
  }, [fontSize])

  useEffect(() => {
    const browserNotes = notes.filter(note => !note.fileHandle)
    if (notes.length === 0) return
    localStorage.setItem('quickNotes', JSON.stringify(browserNotes))
    saveFileMetaForNotes(notes)
    if (browserNotes.length > 0) {
      setLastSaved(new Date())
      setJustSaved(true)
      const timer = setTimeout(() => setJustSaved(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [notes])

  useEffect(() => {
    if (!jumpTo || jumpTo.noteId !== activeNoteId) return
    const el = textareaRef.current
    if (!el) return
    el.focus()
    el.setSelectionRange(jumpTo.start, jumpTo.end)
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 22
    const line = (el.value.slice(0, jumpTo.start).split('\n').length) - 1
    el.scrollTop = Math.max(0, (line - 2) * lineHeight)
    setJumpTo(null)
  }, [jumpTo, activeNoteId, notes])

  const getActiveNote = () => {
    return notes.find(note => note.id === activeNoteId) || {}
  }

  const showToast = (text) => {
    setMilestoneText(text)
    setShowMilestone(true)
    setTimeout(() => setShowMilestone(false), 2000)
  }

  const patchNote = (noteId, updater) => {
    setNotes(prevNotes => sortNotes(prevNotes.map(note => (
      note.id === noteId ? normalizeNote(updater(note)) : note
    ))))
  }

  const handleOpenFolder = async () => {
    try {
      const handle = await openDirectory()
      if (handle) {
        setDirHandle(handle)
        setIsLocalMode(true)
        const localNotes = await readNotesFromDirectory(handle)
        const withMeta = mergeFolderNotes(localNotes, loadFileMeta())

        setNotes(prevNotes => {
          const browserNotes = prevNotes.filter(note => !note.fileHandle)
          return sortNotes([...browserNotes, ...withMeta])
        })

        if (withMeta.length > 0) {
          setActiveNoteId(withMeta[0].id)
        }
      }
    } catch (error) {
      console.error('Error opening directory:', error)
      alert('Failed to open directory. Please try again.')
    }
  }

  const createNewNote = async (templateId = 'blank') => {
    const newNote = normalizeNote(applyTemplate({
      id: Date.now().toString(),
      lastModified: Date.now(),
    }, templateId))

    setNotes(prevNotes => sortNotes([newNote, ...prevNotes]))
    setActiveNoteId(newNote.id)
    setTagFilter(null)
  }

  const updateNote = async (key, value) => {
    const activeNote = getActiveNote()

    setNotes(prevNotes => sortNotes(prevNotes.map(note => {
      if (note.id !== activeNoteId) return note
      if (key === 'content') return normalizeNote(withContentChange(note, value))
      return normalizeNote({ ...note, [key]: value, lastModified: Date.now() })
    })))

    if (activeNote.fileHandle && key === 'content') {
      try {
        await saveNoteToFile(activeNote.fileHandle, value)
        setLastSaved(new Date())
        setJustSaved(true)
        setTimeout(() => setJustSaved(false), 2000)
      } catch (error) {
        console.error('Error saving to file:', error)
      }
    }
  }

  const deleteNote = (noteId) => {
    setNoteToDelete(noteId)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return

    const note = notes.find(n => n.id === noteToDelete)
    if (note && note.fileHandle) {
      try {
        await deleteNoteFile(dirHandle, noteToDelete)
      } catch (error) {
        console.error('Error deleting file:', error)
        alert('Failed to delete file.')
        return
      }
    }

    setNotes(prevNotes => {
      const newNotes = prevNotes.filter(note => note.id !== noteToDelete)
      if (newNotes.length === 0) {
        const created = normalizeNote(applyTemplate({
          id: Date.now().toString(),
          lastModified: Date.now(),
        }, 'blank'))
        setActiveNoteId(created.id)
        return [created]
      }
      if (activeNoteId === noteToDelete && newNotes.length > 0) {
        setActiveNoteId(sortNotes(newNotes)[0].id)
      }
      return sortNotes(newNotes)
    })

    setDeleteModalOpen(false)
    setNoteToDelete(null)
  }

  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault()
        setFocusMode(open => !open)
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault()
        downloadAsText()
      }

      if (e.key === 'Escape' && focusMode) {
        setFocusMode(false)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [focusMode, notes, activeNoteId])

  const handleChange = (e) => {
    updateNote('content', e.target.value)
  }

  const handleClear = () => {
    if (confirm('Clear all content? This cannot be undone.')) {
      updateNote('content', '')
      textareaRef.current?.focus()
    }
  }

  const getCharCount = () => {
    return getActiveNote().content?.length || 0
  }

  const getWordCount = () => {
    return getActiveNote().content?.trim().split(/\s+/).filter(word => word.length > 0).length || 0
  }

  const getLineCount = () => {
    return getActiveNote().content?.split('\n').length || 0
  }

  const getLastSavedText = () => {
    if (!lastSaved) return ''

    const now = new Date()
    const diff = Math.floor((now - lastSaved) / 1000)

    if (diff < 5) return 'just now'
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const downloadAsText = () => {
    const activeNote = getActiveNote()
    const blob = new Blob([activeNote.content || ''], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeNote.title || 'quick-note'}-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  const downloadAsMarkdown = () => {
    const activeNote = getActiveNote()
    const blob = new Blob([activeNote.content || ''], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeNote.title || 'quick-note'}-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getActiveNote().content || '').then(() => {
      showToast('✓ Copied to clipboard!')
      setShowExportMenu(false)
    })
  }

  const handleBackup = () => {
    const browserNotes = notes.filter((note) => !note.fileHandle)
    if (browserNotes.length === 0) {
      alert('No browser notes to back up. Folder notes already live on disk.')
      return
    }
    const bytes = zipBrowserNotes(browserNotes)
    const blob = new Blob([bytes], { type: 'application/zip' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `typenow-notes-${new Date().toISOString().split('T')[0]}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('✓ Backup downloaded')
  }

  const handleRestore = async (file) => {
    try {
      const buffer = new Uint8Array(await file.arrayBuffer())
      const restored = unzipBrowserNotes(buffer)
      if (restored.length === 0) {
        alert('No markdown notes found in that zip.')
        return
      }
      setNotes((prev) => {
        const merged = mergeRestoredNotes(prev, restored)
        setActiveNoteId(merged[0]?.id || activeNoteId)
        return merged
      })
      showToast(`✓ Restored ${restored.length} note${restored.length === 1 ? '' : 's'}`)
    } catch (error) {
      console.error(error)
      alert('Could not restore that zip. Use a TypeNow backup of markdown files.')
    }
  }

  const handleJump = (result) => {
    setTagFilter(null)
    setActiveNoteId(result.id)
    setJumpTo({
      noteId: result.id,
      start: result.field === 'body' ? result.start : 0,
      end: result.field === 'body' ? result.end : 0,
    })
  }

  const addTagToActive = (event) => {
    event.preventDefault()
    const tag = tagDraft.trim()
    if (!tag) return
    const active = getActiveNote()
    if (!active.id) return
    patchNote(active.id, (note) => {
      const exists = (note.tags || []).some((item) => item.toLowerCase() === tag.toLowerCase())
      return exists ? note : toggleTag(note, tag)
    })
    setTagDraft('')
  }

  const activeNote = getActiveNote()
  const knownTags = collectTags(notes)

  return (
    <div className="app">
      <div className="app-container">
        <Sidebar
          notes={notes}
          activeNoteId={activeNoteId}
          tagFilter={tagFilter}
          onSelectNote={setActiveNoteId}
          onCreateNote={createNewNote}
          onDeleteNote={deleteNote}
          onOpenFolder={handleOpenFolder}
          onRenameNote={(noteId, title) => patchNote(noteId, (note) => ({ ...note, title, lastModified: Date.now() }))}
          onTogglePin={(noteId) => patchNote(noteId, (note) => ({ ...note, pinned: !note.pinned, lastModified: Date.now() }))}
          onSearch={() => setSearchOpen(true)}
          onBackup={handleBackup}
          onRestore={handleRestore}
          onTagFilter={setTagFilter}
          isLocalMode={isLocalMode}
          dirName={dirHandle?.name}
        />

        <div className="main-content">
          <header className={`header ${focusMode ? 'hidden' : ''}`}>
            <div className="header-content">
              <div className="title-section">
                <input
                  className="note-title-input"
                  value={activeNote.title || ''}
                  onChange={(event) => updateNote('title', event.target.value)}
                  placeholder="Note title"
                  aria-label="Note title"
                />
                <p className="subtitle">qnote keeps notes on your device unless you open a folder</p>
                <div className="active-tags">
                  {(activeNote.tags || []).map((tag) => (
                    <button
                      key={tag}
                      className="tag-chip active"
                      onClick={() => patchNote(activeNote.id, (note) => toggleTag(note, tag))}
                      title="Remove tag"
                    >
                      {tag} ×
                    </button>
                  ))}
                  {knownTags
                    .filter((tag) => !(activeNote.tags || []).some((item) => item.toLowerCase() === tag.toLowerCase()))
                    .map((tag) => (
                      <button
                        key={tag}
                        className="tag-chip"
                        onClick={() => patchNote(activeNote.id, (note) => toggleTag(note, tag))}
                      >
                        + {tag}
                      </button>
                    ))}
                  <form className="tag-add-form" onSubmit={addTagToActive}>
                    <input
                      className="tag-add-input"
                      value={tagDraft}
                      onChange={(event) => setTagDraft(event.target.value)}
                      placeholder="Add tag"
                      aria-label="Add tag"
                    />
                  </form>
                </div>
              </div>
              <div className="header-actions">
                <div className="font-size-controls">
                  <button
                    className={`font-btn ${fontSize === 'small' ? 'active' : ''}`}
                    onClick={() => setFontSize('small')}
                    title="Small font"
                  >
                    A
                  </button>
                  <button
                    className={`font-btn ${fontSize === 'medium' ? 'active' : ''}`}
                    onClick={() => setFontSize('medium')}
                    title="Medium font"
                  >
                    A
                  </button>
                  <button
                    className={`font-btn large ${fontSize === 'large' ? 'active' : ''}`}
                    onClick={() => setFontSize('large')}
                    title="Large font"
                  >
                    A
                  </button>
                </div>

                <div className="export-menu-container">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="export-btn"
                    title="Export options"
                  >
                    <span className="btn-icon">↓</span>
                    <span className="btn-text">Export</span>
                  </button>
                  {showExportMenu && (
                    <div className="export-dropdown">
                      <button onClick={downloadAsText} className="export-option">
                        <span>📄</span> Download as .txt
                      </button>
                      <button onClick={downloadAsMarkdown} className="export-option">
                        <span>✍️</span> Download as .md
                      </button>
                      <button onClick={copyToClipboard} className="export-option">
                        <span>📋</span> Copy to clipboard
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className={`preview-btn ${isPreviewMode ? 'active' : ''}`}
                  title="Toggle Markdown Preview"
                >
                  <span className="btn-icon">👁️</span>
                  <span className="btn-text">Preview</span>
                </button>

                <button
                  onClick={() => setFocusMode(!focusMode)}
                  className="focus-btn"
                  title="Focus mode (Cmd+E)"
                >
                  <span className="btn-icon">⚡</span>
                  <span className="btn-text">Focus</span>
                </button>

                <button onClick={handleClear} className="clear-btn" title="Clear all content">
                  <span className="btn-icon">✕</span>
                  <span className="btn-text">Clear</span>
                </button>
              </div>
            </div>
          </header>

          <main className={`editor-container ${isPreviewMode ? 'split-view' : ''}`}>
            <textarea
              ref={textareaRef}
              className={`editor font-${fontSize} ${focusMode ? 'focus-mode' : ''} ${isPreviewMode ? 'split-left' : ''}`}
              value={activeNote.content || ''}
              onChange={handleChange}
              placeholder="Start typing..."
              spellCheck="true"
            />

            {isPreviewMode && (
              <div className={`markdown-preview font-${fontSize} split-right`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeNote.content || ''}
                </ReactMarkdown>
              </div>
            )}

            {showMilestone && (
              <div className="milestone-badge">
                {milestoneText}
              </div>
            )}

            {focusMode && (
              <div className="focus-mode-hint">
                Press <kbd>Esc</kbd> to exit focus mode
              </div>
            )}

            {!focusMode && (
              <div className="keyboard-hint">
                <kbd>Cmd</kbd> + <kbd>K</kbd> search · <kbd>Cmd</kbd> + <kbd>E</kbd> focus
              </div>
            )}
          </main>

          <footer className={`footer ${focusMode ? 'hidden' : ''}`}>
            <div>
              <div className="stats">
                <span className="stat-item">
                  <span className="stat-value">{getCharCount()}</span> characters
                </span>
                <span className="divider">•</span>
                <span className="stat-item">
                  <span className="stat-value">{getWordCount()}</span> words
                </span>
                <span className="divider">•</span>
                <span className="stat-item">
                  <span className="stat-value">{getLineCount()}</span> lines
                </span>
              </div>
              {lastSaved && (
                <div className={`save-status ${justSaved ? 'pulse' : ''}`}>
                  <span className="save-icon">✓</span>
                  <span>Saved {getLastSavedText()}</span>
                </div>
              )}
            </div>
          </footer>
        </div>
      </div>

      <SearchPalette
        notes={notes}
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onJump={handleJump}
      />

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
      />
    </div>
  )
}

export default App
