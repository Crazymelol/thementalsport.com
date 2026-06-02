# Connecting Mike to Google (one-time setup)

This guide walks you through giving Mike real access to your Google account
(Calendar, Drive, Docs, Sheets, Contacts) through a single stored OAuth refresh
token. You only do this once. Set aside about 15 minutes.

The whole process has four parts:

1. Create a Google Cloud project and turn on the APIs.
2. Configure the OAuth consent screen and publish the app.
3. Create an OAuth client and put its ID/secret into Vercel.
4. Run the connect flow once to capture your refresh token.

> **A note on the "unverified app" warning.** Because this app is yours and is
> used only by you, Google will show a scary-looking "Google hasn't verified
> this app" screen when you connect. This is expected and safe for personal use
> — you are the developer and the only user. You do not need to submit the app
> for Google verification. The steps below tell you exactly where to click past
> the warning.

---

## Part 1 — Create the project and enable the APIs

1. Go to <https://console.cloud.google.com/>. Sign in with the Google account
   you want Mike to use (the one whose calendar/drive he should see).
2. In the top bar, click the **project picker** (it says "Select a project" or
   shows the current project name) → **New Project**.
3. Give it a name like `Mike` and click **Create**. Wait a few seconds, then
   make sure the new project is selected in the top bar.
4. Now turn on the five APIs Mike needs. For each one below, paste the link into
   your browser (with the project selected), then click the blue **Enable**
   button:
   - Google Calendar API — <https://console.cloud.google.com/apis/library/calendar-json.googleapis.com>
   - Google Drive API — <https://console.cloud.google.com/apis/library/drive.googleapis.com>
   - Google Docs API — <https://console.cloud.google.com/apis/library/docs.googleapis.com>
   - Google Sheets API — <https://console.cloud.google.com/apis/library/sheets.googleapis.com>
   - Google People API (Contacts) — <https://console.cloud.google.com/apis/library/people.googleapis.com>

   After each **Enable**, you'll land on the API's dashboard. Just go back to the
   next link. When all five are enabled you're done with Part 1.

---

## Part 2 — Configure and publish the OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**:
   <https://console.cloud.google.com/apis/credentials/consent>
2. Choose **User Type: External**, then click **Create**.
   (External just means "a normal Google account", not "the public" — you still
   control who can use it.)
3. **App information** page:
   - **App name:** `Mike`
   - **User support email:** pick your email from the dropdown.
   - **Developer contact information:** type your email at the bottom.
   - Leave everything else blank and click **Save and Continue**.
4. **Scopes** page → click **Add or Remove Scopes**. A panel opens on the right.
   At the bottom there is a box labelled "Manually add scopes". Paste these five
   scopes, one per line, then click **Add to Table**:
   ```
   https://www.googleapis.com/auth/calendar
   https://www.googleapis.com/auth/drive
   https://www.googleapis.com/auth/documents
   https://www.googleapis.com/auth/spreadsheets
   https://www.googleapis.com/auth/contacts
   ```
   Then click **Update**, and back on the Scopes page click
   **Save and Continue**.
5. **Test users** page → click **Add Users**, type your own Google email
   (the account from Part 1), click **Add**, then **Save and Continue**.
6. Review the summary and click **Back to Dashboard**.
7. **Publish to Production.** On the OAuth consent screen dashboard you'll see a
   **Publishing status: Testing** box with a **Publish App** button. Click
   **Publish App**, then **Confirm**.
   - Publishing to Production means your refresh token won't expire after 7 days
     (test-mode tokens do). You can ignore the "needs verification" prompt — it
     only matters if you wanted other people to use the app.

---

## Part 3 — Create the OAuth client and add it to Vercel

You need your deployed domain for this step. It looks like
`https://your-app.vercel.app` (or your custom domain). Have it ready.

1. Go to **APIs & Services → Credentials**:
   <https://console.cloud.google.com/apis/credentials>
2. Click **+ Create Credentials → OAuth client ID**.
3. **Application type:** choose **Web application**.
4. **Name:** `Mike Web`.
5. Under **Authorized redirect URIs**, click **Add URI** and enter exactly:
   ```
   https://<your-domain>/api/google/callback
   ```
   Replace `<your-domain>` with your real domain, e.g.
   `https://your-app.vercel.app/api/google/callback`. The path
   `/api/google/callback` must be exact.
6. Click **Create**. A dialog shows your **Client ID** and **Client secret** —
   keep this open (or download the JSON).
7. Now add them to Vercel:
   - Open your project in Vercel → **Settings → Environment Variables**.
   - Add `GOOGLE_CLIENT_ID` = the Client ID.
   - Add `GOOGLE_CLIENT_SECRET` = the Client secret.
   - (Leave `GOOGLE_REFRESH_TOKEN` empty for now — you'll add it in Part 4.)
   - Apply them to the **Production** environment (and Preview if you want).
8. **Redeploy** so the new variables take effect: in Vercel go to
   **Deployments → ⋯ on the latest deploy → Redeploy**.

---

## Part 4 — Connect once and capture the refresh token

1. In your browser, visit:
   ```
   https://<your-domain>/api/google/auth
   ```
   This redirects you to Google's consent screen.
2. Choose the Google account from Part 1.
3. You'll see **"Google hasn't verified this app"**. This is expected (see the
   note at the top). Click **Advanced** (bottom-left), then
   **Go to Mike (unsafe)**.
4. Google shows the list of permissions Mike is requesting (Calendar, Drive,
   Docs, Sheets, Contacts). Click **Continue** / **Allow** to grant all of them.
5. Google sends you back to Mike's callback page. It will display a long
   **refresh token** string in a box, with instructions.
6. Copy that entire token. In Vercel → **Settings → Environment Variables**, add:
   - `GOOGLE_REFRESH_TOKEN` = the value you just copied (Production environment).
7. **Redeploy** once more (Deployments → Redeploy).

That's it. Mike is now connected.

---

## Verifying it works

After the final redeploy, open Mike and try:

- "What's on my calendar today?" → you should see your real events, not the
  sample Standup / Deep-work block.
- "Add a 30-minute event called Test tomorrow at 3pm" → Mike shows an approval
  card; approve it and the event should appear in your real Google Calendar.

---

## Troubleshooting

- **"No refresh token returned" on the callback page.** Google only returns a
  refresh token the first time you authorize. Remove the app at
  <https://myaccount.google.com/permissions> (find "Mike", click Remove Access),
  then visit `/api/google/auth` again.
- **`redirect_uri_mismatch` error from Google.** The redirect URI in your OAuth
  client (Part 3, step 5) must match your domain exactly, including `https://`
  and the `/api/google/callback` path. Fix it in the Credentials page and retry.
- **Calendar falls back to sample data.** That means one of the three
  `GOOGLE_*` env vars is missing/blank in Vercel, or you didn't redeploy after
  setting them. Double-check all three are present in Production and redeploy.
- **"Google connection lost — please reconnect."** Your refresh token was
  revoked or expired (e.g. password change, or the app was still in Testing
  mode). Repeat Part 4 to get a fresh token, and make sure the app is Published
  to Production (Part 2, step 7).
