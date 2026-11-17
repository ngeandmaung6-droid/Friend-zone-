# Friend Zone — 2016 to Infinity

A responsive, shareable photo album built with React, Vite, and Supabase.

## Features
- Public visitors can view the album.
- Upload multiple photos (JPEG, PNG, WebP, GIF; max 8 MB each).
- The uploader can delete their own photos. Other visitors cannot delete them.
- Mobile-friendly layout and full-screen photo viewer.
- Photos remain online after deployment because they are stored in Supabase.

## 1. Create the online photo database
1. Create a free project at https://supabase.com/.
2. Open **Authentication → Sign In / Providers** and enable **Anonymous Sign-Ins**.
3. Open **SQL Editor → New query**.
4. Copy all contents of `supabase/setup.sql` into the editor and click **Run**.
5. Open **Project Settings → API** (or **Connect**) and copy the Project URL and anon/publishable key. Never use a `service_role` or secret key in this website.

## 2. Run the website on your computer
Install Node.js LTS from https://nodejs.org/.
1. Extract this ZIP.
2. Open a terminal in the extracted `friend-zone-website` folder.
3. Run `npm install`.
4. Copy `.env.example` to a new file named `.env`.
5. Put your Supabase values in `.env`:
   ```
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY
   ```
6. Run `npm run dev`.
7. Open the local address shown in the terminal (usually http://localhost:5173).

## 3. Publish a public link with Vercel
1. Create/sign in to https://github.com/ and create a new repository.
2. Upload the extracted project files to the repository. Include `src/`, `supabase/`, `index.html`, `package.json`, and `vite.config.js`. Do not upload `.env`.
3. Create/sign in to https://vercel.com/ and choose **Add New → Project**.
4. Import your GitHub repository.
5. Vercel usually detects Vite automatically. Build command: `npm run build`; output directory: `dist`.
6. Before deploying, open **Environment Variables** and add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon/publishable key
7. Click **Deploy**. Vercel will provide a public URL such as `https://your-project.vercel.app`.
8. Share that URL. Anyone can open it and view the album.

## 4. Important notes
- Every visitor can view photos. Only the browser/account that uploaded a photo sees its delete button. The delete permission is enforced by Supabase, not just the interface.
- Anonymous identity is stored by Supabase in that browser. Clearing browser data or switching devices can mean you no longer have delete access to photos uploaded from the old browser. Keep a backup of important photos.
- Do not put your Supabase service-role key in `.env` or in frontend code.
- Public album means photos are visible to anyone with the link (and potentially discoverable if shared publicly). Do not upload private or sensitive images.
- This project does not yet include comments, password protection, or admin moderation.
