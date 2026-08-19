import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  notesFromBackupFiles,
  notesToBackupFiles,
  parseMarkdownBackup,
  serializeMarkdownBackup,
} from './backup.js'

test('markdown backup round-trips title, tags, pin, and body', () => {
  const note = {
    id: 'abc',
    title: 'Sprint planning',
    content: '# Hello\n\nWorld',
    pinned: true,
    tags: ['Work', 'Meetings'],
    lastModified: 1700000000000,
  }
  const markdown = serializeMarkdownBackup(note)
  const restored = parseMarkdownBackup('Sprint planning.md', markdown)
  assert.equal(restored.id, 'abc')
  assert.equal(restored.title, 'Sprint planning')
  assert.equal(restored.content, '# Hello\n\nWorld')
  assert.equal(restored.pinned, true)
  assert.deepEqual(restored.tags, ['Work', 'Meetings'])
  assert.equal(restored.lastModified, 1700000000000)
})

test('backup files skip folder notes and use unique markdown names', () => {
  const files = notesToBackupFiles([
    { id: '1', title: 'Same', content: 'a', fileHandle: {} },
    { id: '2', title: 'Same', content: 'one' },
    { id: '3', title: 'Same', content: 'two' },
  ])
  assert.equal(files.length, 2)
  assert.deepEqual(files.map((file) => file.name), ['Same.md', 'Same-2.md'])
})

test('restore reads every markdown file in the backup', () => {
  const files = notesToBackupFiles([
    { id: '1', title: 'Alpha', content: 'aaa', pinned: false, tags: [] },
  ])
  const restored = notesFromBackupFiles(files)
  assert.equal(restored.length, 1)
  assert.equal(restored[0].title, 'Alpha')
  assert.equal(restored[0].content, 'aaa')
})
