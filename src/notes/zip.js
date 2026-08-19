import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { notesFromBackupFiles, notesToBackupFiles } from './backup.js'

export function zipBrowserNotes(notes) {
  const files = notesToBackupFiles(notes)
  const entries = {}
  for (const file of files) {
    entries[file.name] = strToU8(file.content)
  }
  return zipSync(entries)
}

export function unzipBrowserNotes(bytes) {
  const unzipped = unzipSync(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))
  const files = Object.entries(unzipped).map(([name, data]) => ({
    name,
    content: strFromU8(data),
  }))
  return notesFromBackupFiles(files)
}
