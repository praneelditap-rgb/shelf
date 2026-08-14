// ---------------------------------------------------------------
// Paste your two Supabase values here, then save.
// Find them in Supabase → your project → Settings → API
//
// These two are safe to keep in a public repo. The anon key only
// works together with the security rules you set up in the README,
// which limit every row and every file to the account that made it.
// ---------------------------------------------------------------

window.SHELF_CONFIG = {
  SUPABASE_URL: "https://YOUR-PROJECT-ID.supabase.co",
  SUPABASE_ANON_KEY: "YOUR-ANON-KEY",

  // Only these email addresses can sign in and see your files.
  ALLOWED_EMAILS: ["you@example.com"],
};
