import React from 'react';

const Sidebar = ({ notes, activeNoteId, onSelectNote, onCreateNote, onDeleteNote, onOpenFolder, isLocalMode, dirName }) => {
    const browserNotes = notes.filter(note => !note.fileHandle);
    const localNotes = notes.filter(note => note.fileHandle);

    const renderNoteList = (notesList, title) => {
        if (notesList.length === 0) return null;
        return (
            <div className="notes-section">
                <h3 className="notes-section-title">{title}</h3>
                {notesList.map((note) => (
                    <div
                        key={note.id}
                        className={`note-item ${note.id === activeNoteId ? 'active' : ''}`}
                        onClick={() => onSelectNote(note.id)}
                    >
                        <div className="note-item-content">
                            <h3 className="note-title">
                                {note.title || 'Untitled Note'}
                            </h3>
                            <p className="note-preview">
                                {note.content ? note.content.substring(0, 50) : 'No content'}
                            </p>
                            <span className="note-date">
                                {new Date(note.lastModified).toLocaleDateString()}
                            </span>
                        </div>
                        <button
                            className="delete-note-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNote(note.id);
                            }}
                            title="Delete note"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-title-section">
                    <h2 className="sidebar-title">Notes</h2>
                    {isLocalMode && <span className="local-badge" title={dirName}>📂 {dirName}</span>}
                </div>
                <div className="sidebar-actions">
                    <button className="icon-btn" onClick={onOpenFolder} title="Open Local Folder">
                        <span className="btn-icon">📂</span>
                    </button>
                    <button className="icon-btn new-note-btn" onClick={onCreateNote} title="Create new note">
                        <span className="btn-icon">+</span>
                    </button>
                </div>
            </div>
            <div className="notes-list">
                {renderNoteList(browserNotes, 'Browser Notes')}
                {renderNoteList(localNotes, 'Local Notes')}

                {notes.length === 0 && (
                    <div className="empty-notes">
                        <p>No notes yet</p>
                        <button onClick={onCreateNote} className="create-first-note-btn">Create one</button>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
