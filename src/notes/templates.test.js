import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyTemplate, NOTE_TEMPLATES } from './templates.js'

test('ships meeting, standup, bug report, and blank templates', () => {
  assert.deepEqual(
    NOTE_TEMPLATES.map((template) => template.id),
    ['blank', 'meeting', 'standup', 'bug'],
  )
})

test('applyTemplate sets title and body for a meeting note', () => {
  const note = applyTemplate({ id: '1' }, 'meeting')
  assert.equal(note.title, 'Meeting')
  assert.match(note.content, /Agenda/)
  assert.ok(note.tags.includes('Meetings'))
})

test('blank template keeps Untitled Note and empty content', () => {
  const note = applyTemplate({ id: '1' }, 'blank')
  assert.equal(note.title, 'Untitled Note')
  assert.equal(note.content, '')
})
