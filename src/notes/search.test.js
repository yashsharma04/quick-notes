import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findMatch, searchNotes } from './search.js'

const notes = [
  { id: '1', title: 'Standup', content: 'Yesterday I shipped search.\nToday I will pin notes.' },
  { id: '2', title: 'Grocery', content: 'Milk and eggs' },
  { id: '3', title: 'Untitled Note', content: '' },
]

test('search matches title case-insensitively', () => {
  const results = searchNotes(notes, 'standup')
  assert.equal(results.length, 1)
  assert.equal(results[0].id, '1')
  assert.equal(results[0].field, 'title')
})

test('search matches body and reports line offset', () => {
  const results = searchNotes(notes, 'pin notes')
  assert.equal(results.length, 1)
  assert.equal(results[0].id, '1')
  assert.equal(results[0].field, 'body')
  assert.equal(results[0].lineNumber, 2)
  assert.equal(results[0].start, 'Yesterday I shipped search.\nToday I will '.length)
})

test('empty or whitespace query returns no results', () => {
  assert.deepEqual(searchNotes(notes, ''), [])
  assert.deepEqual(searchNotes(notes, '   '), [])
})

test('findMatch locates the first occurrence in content', () => {
  const match = findMatch('Hello\nWorld', 'wor')
  assert.equal(match.lineNumber, 2)
  assert.equal(match.start, 6)
  assert.equal(match.end, 9)
})
