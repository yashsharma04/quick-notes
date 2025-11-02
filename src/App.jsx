import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [content, setContent] = useState('')
  const [lastSaved, setLastSaved] = useState(null)
  const [justSaved, setJustSaved] = useState(false)
  const [showMilestone, setShowMilestone] = useState(false)
  const [milestoneText, setMilestoneText] = useState('')
  const [fontSize, setFontSize] = useState('medium') // small, medium, large
  const [focusMode, setFocusMode] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const textareaRef = useRef(null)
  const previousWordCount = useRef(0)

  // Load content and preferences from localStorage on mount
  useEffect(() => {
    const savedContent = localStorage.getItem('quickNoteContent')
    const savedFontSize = localStorage.getItem('quickNoteFontSize')
    
    if (savedContent) {
      setContent(savedContent)
    }
    if (savedFontSize) {
      setFontSize(savedFontSize)
    }
    
    // Auto-focus the textarea
    textareaRef.current?.focus()
  }, [])

  // Save font size preference
  useEffect(() => {
    localStorage.setItem('quickNoteFontSize', fontSize)
  }, [fontSize])

  // Auto-save to localStorage whenever content changes
  useEffect(() => {
    if (content !== null) {
      localStorage.setItem('quickNoteContent', content)
      setLastSaved(new Date())
      
      // Trigger save animation
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2000)
    }
  }, [content])

  // Check for word count milestones
  useEffect(() => {
    const wordCount = getWordCount()
    const milestones = [10, 50, 100, 250, 500, 1000]
    
    if (wordCount > previousWordCount.current) {
      const milestone = milestones.find(m => 
        m === wordCount || (wordCount === m && previousWordCount.current < m)
      )
      
      if (milestone && milestone === wordCount) {
        setMilestoneText(`🎉 ${milestone} words!`)
        setShowMilestone(true)
        setTimeout(() => setShowMilestone(false), 3000)
      }
    }
    
    previousWordCount.current = wordCount
  }, [content])

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
  }, [focusMode, content])

  const handleChange = (e) => {
    setContent(e.target.value)
  }

  const handleClear = () => {
    if (confirm('Clear all content? This cannot be undone.')) {
      setContent('')
      localStorage.removeItem('quickNoteContent')
      textareaRef.current?.focus()
    }
  }

  const getCharCount = () => {
    return content.length
  }

  const getWordCount = () => {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  const getLineCount = () => {
    return content.split('\n').length
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
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quick-note-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  const downloadAsMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quick-note-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content).then(() => {
      setMilestoneText('✓ Copied to clipboard!')
      setShowMilestone(true)
      setTimeout(() => setShowMilestone(false), 2000)
      setShowExportMenu(false)
    })
  }

  return (
    <div className="app">
      <div className="app-container">
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

        <main className="editor-container">
          <textarea
            ref={textareaRef}
            className={`editor font-${fontSize} ${focusMode ? 'focus-mode' : ''}`}
            value={content}
            onChange={handleChange}
            placeholder="Start typing..."
            spellCheck="true"
          />
          
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
  )
}

export default App
