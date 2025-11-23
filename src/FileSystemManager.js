export const openDirectory = async () => {
    try {
        const dirHandle = await window.showDirectoryPicker();
        return dirHandle;
    } catch (error) {
        if (error.name === 'AbortError') {
            return null;
        }
        throw error;
    }
};

export const readNotesFromDirectory = async (dirHandle) => {
    const notes = [];
    for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file' && (entry.name.endsWith('.txt') || entry.name.endsWith('.md'))) {
            const file = await entry.getFile();
            const content = await file.text();
            notes.push({
                id: entry.name, // Use filename as ID for local files
                title: entry.name,
                content: content,
                lastModified: file.lastModified,
                fileHandle: entry,
            });
        }
    }
    return notes.sort((a, b) => b.lastModified - a.lastModified);
};

export const saveNoteToFile = async (fileHandle, content) => {
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
};

export const createNoteFile = async (dirHandle, filename, content) => {
    const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
    await saveNoteToFile(fileHandle, content);
    return fileHandle;
};

export const deleteNoteFile = async (dirHandle, filename) => {
    await dirHandle.removeEntry(filename);
};
