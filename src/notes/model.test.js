import { test } from 'node:test'
import assert from 'node:assert/strict'
import { collectTags, mergeRestoredNotes, normalizeNote, sortNotes, toggleTag, withContentChange } from './model.js'

test('normalizeNote fills pinned, tags, and keeps an existing title', () => {
  const note = normalizeNote({ id: '1', title: 'My title', content: 'Hello' })
  assert.equal(note.pinned, false)
  assert.deepEqual(note.tags, [])
  assert.equal(note.title, 'My title')
})

test('changing content does not rewrite the title', () => {
  const note = normalizeNote({ id: '1', title: 'Meeting', content: 'old' })
  const updated = withContentChange(note, 'Brand new first line\nmore')
  assert.equal(updated.title, 'Meeting')
  assert.equal(updated.content, 'Brand new first line\nmore')
})

test('pinned notes sort above others, then by lastModified', () => {
  const sorted = sortNotes([
    { id: 'a', pinned: false, lastModified: 30, title: 'a' },
    { id: 'b', pinned: true, lastModified: 10, title: 'b' },
    { id: 'c', pinned: false, lastModified: 40, title: 'c' },
    { id: 'd', pinned: true, lastModified: 20, title: 'd' },
  ])
  assert.deepEqual(sorted.map((note) => note.id), ['d', 'b', 'c', 'a'])
})

test('collectTags includes defaults and note tags without duplicates', () => {
  const tags = collectTags([
    { tags: ['Work'] },
    { tags: ['Meetings', 'work'] },
  ])
  assert.deepEqual(tags, ['Work', 'Meetings'])
})

test('toggleTag adds a new tag and removes it on the second call', () => {
  const withTag = toggleTag({ id: '1', tags: [] }, 'Work')
  assert.deepEqual(withTag.tags, ['Work'])
  const withoutTag = toggleTag(withTag, 'work')
  assert.deepEqual(withoutTag.tags, [])
})

test('mergeRestoredNotes replaces browser notes and leaves folder notes alone', () => {
  const merged = mergeRestoredNotes(
    [
      { id: 'keep-file', title: 'Disk', content: 'disk', fileHandle: { kind: 'file' } },
      { id: 'browser', title: 'Old', content: 'old' },
    ],
    [
      { id: 'browser', title: 'Restored', content: 'new body', tags: ['Work'] },
      { id: 'keep-file', title: 'Should not win', content: 'nope' },
      { id: 'fresh', title: 'Fresh', content: 'from zip' },
    ],
  )
  const byId = Object.fromEntries(merged.map((note) => [note.id, note]))
  assert.equal(byId.browser.title, 'Restored')
  assert.equal(byId.browser.content, 'new body')
  assert.equal(byId['keep-file'].title, 'Disk')
  assert.ok(byId['keep-file'].fileHandle)
  assert.equal(byId.fresh.title, 'Fresh')
})
