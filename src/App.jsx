import { useState, useEffect, useRef } from 'react'
import Sidebar from './Sidebar'
import ConfirmationModal from './ConfirmationModal'
import {
  openDirectory,
  readNotesFromDirectory,
  saveNoteToFile,
  createNoteFile,
  deleteNoteFile
} from './FileSystemManager'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './App.css'

function App() {
  const [notes, setNotes] = useState([])
  const [activeNoteId, setActiveNoteId] = useState(null)
  const [lastSaved, setLastSaved] = useState(null)
  const [justSaved, setJustSaved] = useState(false)
  const [showMilestone, setShowMilestone] = useState(false)
  const [milestoneText, setMilestoneText] = useState('')
  const [fontSize, setFontSize] = useState('medium') // small, medium, large
  const [focusMode, setFocusMode] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  // Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState(null)

  // Local Sync State
  const [isLocalMode, setIsLocalMode] = useState(false)
  const [dirHandle, setDirHandle] = useState(null)

  const textareaRef = useRef(null)

  // Load content and preferences from localStorage on mount
  useEffect(() => {
    const savedFontSize = localStorage.getItem('quickNoteFontSize')
    if (savedFontSize) {
      setFontSize(savedFontSize)
    }

    // Migration and Loading Logic
    const savedNotes = JSON.parse(localStorage.getItem('quickNotes') || '[]')
    const oldContent = localStorage.getItem('quickNoteContent')

    if (savedNotes.length > 0) {
      setNotes(savedNotes)
      setActiveNoteId(savedNotes[0].id)
    } else if (oldContent) {
      // Migrate old content to new note format
      const newNote = {
        id: Date.now().toString(),
        title: oldContent.split('\n')[0] || 'Untitled Note',
        content: oldContent,
        lastModified: Date.now()
      }
      setNotes([newNote])
      setActiveNoteId(newNote.id)
      localStorage.setItem('quickNotes', JSON.stringify([newNote]))
    } else {
      // Create initial empty note
      createNewNote()
    }

    // Auto-focus the textarea
    textareaRef.current?.focus()
  }, [])

  // Save font size preference
  useEffect(() => {
    localStorage.setItem('quickNoteFontSize', fontSize)
  }, [fontSize])

  // Auto-save to localStorage whenever notes change (only for browser notes)
  useEffect(() => {
    const browserNotes = notes.filter(note => !note.fileHandle)
    if (browserNotes.length > 0) {
      localStorage.setItem('quickNotes', JSON.stringify(browserNotes))
      setLastSaved(new Date())

      // Trigger save animation
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2000)
    }
  }, [notes])

  const getActiveNote = () => {
    return notes.find(note => note.id === activeNoteId) || {}
  }

  const handleOpenFolder = async () => {
    try {
      const handle = await openDirectory()
      if (handle) {
        setDirHandle(handle)
        setIsLocalMode(true)
        const localNotes = await readNotesFromDirectory(handle)

        setNotes(prevNotes => {
          // Keep existing browser notes, remove any old local notes (if re-opening), and append new local notes
          const browserNotes = prevNotes.filter(note => !note.fileHandle)
          return [...browserNotes, ...localNotes]
        })

        if (localNotes.length > 0) {
          setActiveNoteId(localNotes[0].id)
        }
      }
    } catch (error) {
      console.error('Error opening directory:', error)
      alert('Failed to open directory. Please try again.')
    }
  }

  const createNewNote = async (isLocal = false) => {
    if (isLocal && dirHandle) {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filename = `Untitled-${timestamp}.md`
        const fileHandle = await createNoteFile(dirHandle, filename, '')

        const newNote = {
          id: filename,
          title: filename,
          content: '',
          lastModified: Date.now(),
          fileHandle: fileHandle
        }

        setNotes(prevNotes => [newNote, ...prevNotes])
        setActiveNoteId(newNote.id)
      } catch (error) {
        console.error('Error creating local file:', error)
        alert('Failed to create new file.')
      }
    } else {
      const newNote = {
        id: Date.now().toString(),
        title: 'Untitled Note',
        content: '',
        lastModified: Date.now()
      }
      // Add to beginning of browser notes (which are usually at the top, but we'll just prepend to list)
      setNotes(prevNotes => [newNote, ...prevNotes])
      setActiveNoteId(newNote.id)
    }
  }

  const updateNote = async (key, value) => {
    const activeNote = getActiveNote()

    // Optimistic update
    setNotes(prevNotes => prevNotes.map(note => {
      if (note.id === activeNoteId) {
        const updatedNote = { ...note, [key]: value, lastModified: Date.now() }
        // Update title if content changes and it's the first line (only for browser notes)
        if (!note.fileHandle && key === 'content') {
          const firstLine = value.split('\n')[0]
          updatedNote.title = firstLine || 'Untitled Note'
        }
        return updatedNote
      }
      return note
    }))

    // Persist to file if it's a local note
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
        await deleteNoteFile(dirHandle, noteToDelete) // noteToDelete is filename in local mode
      } catch (error) {
        console.error('Error deleting file:', error)
        alert('Failed to delete file.')
        return
      }
    }

    setNotes(prevNotes => {
      const newNotes = prevNotes.filter(note => note.id !== noteToDelete)
      if (newNotes.length === 0) {
        // If all notes deleted, create a new browser note
        const newNote = {
          id: Date.now().toString(),
          title: 'Untitled Note',
          content: '',
          lastModified: Date.now()
        }
        setActiveNoteId(newNote.id)
        return [newNote]
      }
      // If active note is deleted, switch to the first one
      if (activeNoteId === noteToDelete && newNotes.length > 0) {
        setActiveNoteId(newNotes[0].id)
      }
      return newNotes
    })

    setDeleteModalOpen(false)
    setNoteToDelete(null)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Cmd/Ctrl + E for Focus Mode
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault()
        setFocusMode(!focusMode)
      }

      // Cmd/Ctrl + D for Download
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault()
        downloadAsText()
      }

      // Escape to exit focus mode
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

  // Export Functions
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
      setMilestoneText('✓ Copied to clipboard!')
      setShowMilestone(true)
      setTimeout(() => setShowMilestone(false), 2000)
      setShowExportMenu(false)
    })
  }

  return (
    <div className="app">
      <div className="app-container">
        <Sidebar
          notes={notes}
          activeNoteId={activeNoteId}
          onSelectNote={setActiveNoteId}
          onCreateNote={() => createNewNote()}
          onDeleteNote={deleteNote}
          onOpenFolder={handleOpenFolder}
          isLocalMode={isLocalMode}
          dirName={dirHandle?.name}
        />

        <div className="main-content">
          <header className={`header ${focusMode ? 'hidden' : ''}`}>
            <div className="header-content">
              <div className="title-section">
                <h1 className="title">Quick Notes</h1>
                <p className="subtitle">Notes are stored in your browser</p>
              </div>
              <div className="header-actions">
                {/* Font Size Controls */}
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

                {/* Export Menu */}
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

                {/* Preview Mode Toggle */}
                <button
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className={`preview-btn ${isPreviewMode ? 'active' : ''}`}
                  title="Toggle Markdown Preview"
                >
                  <span className="btn-icon">👁️</span>
                  <span className="btn-text">Preview</span>
                </button>

                {/* Focus Mode Toggle */}
                <button
                  onClick={() => setFocusMode(!focusMode)}
                  className="focus-btn"
                  title="Focus mode (Cmd+E)"
                >
                  <span className="btn-icon">⚡</span>
                  <span className="btn-text">Focus</span>
                </button>

                {/* Clear Button */}
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
              value={getActiveNote().content || ''}
              onChange={handleChange}
              placeholder="Start typing..."
              spellCheck="true"
            />

            {isPreviewMode && (
              <div className={`markdown-preview font-${fontSize} split-right`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {getActiveNote().content || ''}
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
                Press <kbd>Cmd</kbd> + <kbd>E</kbd> for focus mode
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
