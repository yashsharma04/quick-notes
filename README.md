# Quick Notes

A fast, minimal note-taking app that's instantly ready when you need it. Like having Sublime Text in your browser - perfect for meeting notes, quick thoughts, and documentation.

![Quick Notes Screenshot](screenshot.png)

## ✨ Features

- **Instant Start** - Auto-focused textarea means you can start typing immediately
- **Auto-Save** - Your notes are automatically saved to browser localStorage as you type
- **Persistent** - Your notes are preserved between sessions
- **Clean UI** - Minimal, distraction-free interface with a modern design
- **Real-time Stats** - Live character, word, and line counts
- **Dark Mode** - Automatically adapts to your system theme preferences
- **Responsive** - Works perfectly on desktop, tablet, and mobile devices
- **Fast** - Built with React and Vite for lightning-fast performance

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

### Production Build

To build for production:

```bash
npm run build
```

The built files will be in the `dist` folder. You can serve them with any static file server, or deploy to services like:
- Vercel
- Netlify
- GitHub Pages
- Firebase Hosting

## 🎯 Usage

1. Open the app
2. Start typing immediately (textarea is auto-focused)
3. Your notes are automatically saved as you type
4. Close and reopen - your notes will still be there
5. Use the "Clear" button to start fresh (with confirmation)

## 🛠️ Technology Stack

- **React** - UI framework
- **Vite** - Build tool and dev server
- **localStorage** - Browser storage for persistence
- **CSS3** - Modern styling with CSS variables for theming

## 📝 Keyboard Shortcuts

The app supports standard browser text editing shortcuts:
- `Cmd/Ctrl + A` - Select all
- `Cmd/Ctrl + C/V/X` - Copy, paste, cut
- `Cmd/Ctrl + Z/Y` - Undo, redo
- `Tab` - Insert tab (2 spaces)

## 🎨 Customization

The app uses CSS variables for theming. You can customize colors by editing the `:root` section in `src/App.css`:

```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #1a1a1a;
  --accent-color: #4a9eff;
  /* ... more variables */
}
```

## 🔒 Privacy

All your notes are stored locally in your browser using localStorage. Nothing is sent to any server. Your data stays on your device.

## 📱 Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (v90+)
- Firefox (v88+)
- Safari (v14+)

## 📄 License

MIT License - feel free to use this for any purpose!

## 🤝 Contributing

Feel free to fork, modify, and improve! This is a simple project that can be extended with features like:
- Multiple notes with tabs
- Markdown preview
- Export to file
- Cloud sync
- Keyboard shortcuts customization
- Custom fonts and themes

## 💡 Use Cases

- Quick meeting notes
- Scratch pad for ideas
- Draft emails or messages
- Code snippets
- Todo lists
- Temporary calculations
- Copy-paste buffer
- Interview notes

---

Made with ❤️ for quick thinkers and fast typers.
