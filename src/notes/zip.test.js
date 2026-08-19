import { test } from 'node:test'
import assert from 'node:assert/strict'
import { unzipBrowserNotes, zipBrowserNotes } from './zip.js'

test('zip backup round-trips browser notes', () => {
  const notes = [
    { id: '9', title: 'Kept', content: 'body text', pinned: false, tags: ['Work'] },
  ]
  const restored = unzipBrowserNotes(zipBrowserNotes(notes))
  assert.equal(restored.length, 1)
  assert.equal(restored[0].title, 'Kept')
  assert.equal(restored[0].content, 'body text')
  assert.deepEqual(restored[0].tags, ['Work'])
})
