# Snapbook Setup Guide

## Prerequisites
- Node.js 18+
- A Supabase account (free tier works)
- A Google Cloud project (for OAuth)

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon public key** from Settings > API

## 2. Run the SQL Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Paste the entire contents of `supabase-schema.sql` from this project
4. Click **Run** — this creates all tables, RLS policies, and the storage bucket

## 3. Enable Google OAuth

### Google Cloud Console:
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Go to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**
5. Application type: **Web application**
6. Add **Authorized redirect URIs**:
   - `https://<your-supabase-ref>.supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret**

### Supabase Dashboard:
1. Go to **Authentication > Providers**
2. Enable **Google**
3. Paste your Google Client ID and Client Secret
4. Save

## 4. Configure Redirect URLs in Supabase

1. Go to **Authentication > URL Configuration**
2. Set **Site URL**: `http://localhost:3000` (change to your Vercel URL after deploy)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://your-app.vercel.app/auth/callback`

## 5. Set Up Environment Variables

Copy the example env file:
```bash
cp .env.local.example .env.local
```

Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 6. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 7. Deploy to Vercel

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Add the same environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

After deploying:
- Update **Site URL** in Supabase Auth settings to your Vercel URL
- Add `https://your-app.vercel.app/auth/callback` to Supabase redirect URLs
- Add `https://your-app.vercel.app/auth/callback` to Google OAuth redirect URIs

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Tailwind + scrapbook styles
│   ├── layout.tsx           # Root layout with fonts
│   ├── page.tsx             # Landing page (sign in)
│   ├── auth/callback/
│   │   └── route.ts         # OAuth callback handler
│   ├── dashboard/
│   │   └── page.tsx         # User dashboard (list scrapbooks)
│   └── scrapbook/[id]/
│       ├── page.tsx          # View scrapbook (read-only aesthetic)
│       └── edit/page.tsx     # Edit scrapbook (CRUD memories)
├── components/
│   ├── DashboardClient.tsx   # Dashboard UI + create/delete scrapbooks
│   ├── ScrapbookEditor.tsx   # Edit scrapbook: title + memories list
│   ├── MemoryCard.tsx        # Single memory editor (note, date, photos, song)
│   └── ScrapbookView.tsx     # Beautiful scrollable scrapbook view
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser Supabase client
│   │   ├── server.ts         # Server Supabase client
│   │   └── middleware.ts     # Auth session refresh + route protection
│   └── types/
│       └── database.ts       # TypeScript types for Supabase tables
├── middleware.ts             # Next.js middleware entry point
supabase-schema.sql           # Full SQL for tables, RLS, storage
```
