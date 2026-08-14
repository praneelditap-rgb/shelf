# Shelf — setup

Three files: `index.html` (the whole site), `config.js` (your keys), this guide.
No build step, no install. About 20 minutes start to finish.

---

## 1. Make the Supabase project

1. Go to supabase.com, sign up, **New project**. Pick the region closest to you (`eu-west` or `af-south` if it's offered). Save the database password somewhere.
2. Wait for it to finish setting up (a minute or two).

## 2. Create the tables

Open **SQL Editor** → **New query**, paste all of this, click Run.

```sql
create extension if not exists pgcrypto;

create table subjects (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  name       text not null,
  color      text not null default '#1F9E8F',
  created_at timestamptz not null default now()
);

create table files (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  subject_id uuid not null references subjects on delete cascade,
  cat        text not null,
  title      text not null,
  size       bigint not null default 0,
  path       text not null,
  created_at timestamptz not null default now()
);

create table notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  subject_id uuid not null references subjects on delete cascade,
  kind       text not null,          -- 'tip' or 'link'
  text       text,
  href       text,
  created_at timestamptz not null default now()
);

alter table subjects enable row level security;
alter table files    enable row level security;
alter table notes    enable row level security;

create policy "own subjects" on subjects for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own files" on files for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own notes" on notes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

That last block is what keeps everything private: every row can only be read or
changed by the account that created it, even though the key sits in a public repo.

## 3. Create the file store

1. **Storage** → **New bucket** → name it exactly `shelf` → leave **Public** off → create.
2. Back in **SQL Editor**, run this so your account can read and write its own folder:

```sql
create policy "read own pdfs" on storage.objects for select
  using (bucket_id = 'shelf' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "upload own pdfs" on storage.objects for insert
  with check (bucket_id = 'shelf' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "delete own pdfs" on storage.objects for delete
  using (bucket_id = 'shelf' and (storage.foldername(name))[1] = auth.uid()::text);
```

## 4. Fill in config.js

**Settings** → **API**. Copy the **Project URL** and the **anon public** key into
`config.js`, and put your own email in `ALLOWED_EMAILS`.

## 5. Put it on GitHub

1. New repository, public, name it whatever you like.
2. **Add file** → **Upload files** → drag in `index.html`, `config.js`, `README.md` → commit.
3. **Settings** → **Pages** → Source: *Deploy from a branch*, Branch: `main`, folder: `/ (root)` → Save.
4. A minute later your site is at `https://YOUR-USERNAME.github.io/YOUR-REPO/`.

## 6. Tell Supabase about that address

**Authentication** → **URL Configuration**:

- Site URL: `https://YOUR-USERNAME.github.io/YOUR-REPO/`
- Redirect URLs: add the same address.

Skip this and the sign-in email will land you on the wrong page.

## 7. Sign in, then lock the door

Open your site, enter your email, click the link it sends you. Your seven subjects
appear. Then go back to Supabase → **Authentication** → **Sign In / Providers** and
switch **off** new user signups, so nobody else can make an account on your project.

On your phone: open the site in the browser and use *Add to home screen*. It behaves
like an app after that.

---

## What the free plan gives you

- 1 GB of file storage, and a 50 MB ceiling on any single upload.
- Projects go to sleep after about a week with no activity. Your data stays put —
  you press Resume in the dashboard and it comes back. During finals you'll be on it
  most days anyway.
- No automatic backups on the free plan. Keep the original PDFs on your laptop or in
  Google Drive as well. This site is where you read and print from, not the only copy.

## If something breaks

- **Sign-in link opens a blank page** — step 6 wasn't done, or the address doesn't match exactly.
- **Uploads fail with a permissions error** — the bucket isn't named `shelf`, or the step 3 policies didn't run.
- **Subjects don't appear** — the step 2 SQL didn't run fully. Check Table Editor for `subjects`, `files`, `notes`.
- **Print does nothing on iPhone** — tap Open instead, then use the share sheet to print.
