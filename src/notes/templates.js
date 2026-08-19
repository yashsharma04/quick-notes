export const NOTE_TEMPLATES = [
  {
    id: 'blank',
    label: 'Blank',
    title: 'Untitled Note',
    tags: [],
    content: '',
  },
  {
    id: 'meeting',
    label: 'Meeting',
    title: 'Meeting',
    tags: ['Meetings'],
    content: `# Meeting

Date:
Attendees:

## Agenda
-

## Notes
-

## Actions
- [ ]
`,
  },
  {
    id: 'standup',
    label: 'Standup',
    title: 'Standup',
    tags: ['Work'],
    content: `# Standup

## Yesterday
-

## Today
-

## Blockers
-
`,
  },
  {
    id: 'bug',
    label: 'Bug report',
    title: 'Bug report',
    tags: ['Work'],
    content: `# Bug report

## Summary


## Steps to reproduce
1.

## Expected


## Actual

`,
  },
]

export function applyTemplate(note, templateId) {
  const template = NOTE_TEMPLATES.find((item) => item.id === templateId) || NOTE_TEMPLATES[0]
  return {
    ...note,
    title: template.title,
    content: template.content,
    tags: [...template.tags],
    lastModified: Date.now(),
  }
}
