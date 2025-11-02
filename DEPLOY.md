# Deploy to Cloudflare Pages - Super Easy!

## Method 1: Drag & Drop (EASIEST - 2 minutes)

1. **Build your app** (already done! ✓)
   ```bash
   npm run build
   ```
   This creates a `dist` folder.

2. **Go to Cloudflare Pages**
   - Visit: https://pages.cloudflare.com/
   - Click "Sign up" (free, no credit card needed)
   - Or "Login" if you have an account

3. **Deploy!**
   - Click "Create a project"
   - Click "Upload assets"
   - Drag the entire `dist` folder OR click to browse
   - Project name: `quick-notes` (or any name you like)
   - Click "Deploy site"

4. **Done!** 🎉
   - You'll get a URL like: `quick-notes-abc.pages.dev`
   - Share it instantly!

---

## Method 2: Connect GitHub (Auto-deploys on push)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Connect in Cloudflare**
   - Go to https://pages.cloudflare.com/
   - Click "Create a project"
   - Click "Connect to Git"
   - Select your repository
   
3. **Configure build**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Click "Save and Deploy"

4. **Done!** 
   - Every git push auto-deploys!
   - Get a custom URL like `quick-notes.pages.dev`

---

## Your Free Subdomain Options

After deployment, you can customize your subdomain:
- `quick-notes.pages.dev`
- `typenow.pages.dev`
- `notepad.pages.dev`
- Whatever you choose!

---

## Rebuilding for Updates

Anytime you make changes:
```bash
npm run build
```

Then re-upload the `dist` folder to Cloudflare (if using drag & drop).

Or just `git push` (if using GitHub connection).

