# Play Store Release Guide — Kemchuta Homes (Android)

Package: `com.kemchutahomes.mobile` · First release: `1.0.0` (versionCode 1)

## Build & signing (local only — no EAS)

- Release builds are signed with the **upload key** via `plugins/withReleaseSigning.js`,
  which re-applies signing on every `expo prebuild`.
- Credentials are read at build time from `~/khl-signing/khl-upload.properties`
  (or `$KHL_SIGNING_PROPS`) — never committed. Release builds fail if it's missing.
- Upload key SHA-256: `13:B7:3F:59:7D:53:0A:E7:3C:06:96:41:80:C8:66:7C:97:4A:BA:66:C2:27:FE:DD:AC:E2:32:ED:39:98:7B:E7`
- Back up `khl-upload.jks`, `khl-upload.properties` and the password. With Play App
  Signing on, a lost upload key can be reset via Google support.
- Build the bundle:
  ```bash
  cd android && GRADLE_USER_HOME="F:\gradle-cache" \
    JAVA_HOME="/c/Program Files/Eclipse Adoptium/jdk-17.0.16.8-hotspot" \
    ./gradlew bundleRelease
  ```
  Output: `android/app/build/outputs/bundle/release/app-release.aab`
- Bump `android.versionCode` in `app.json` for every upload.

## Before you start

- **Developer account** at play.google.com/console ($25, identity verification).
- **Personal vs organisation account:** personal accounts must run a 12-tester,
  14-day closed test before production. Organisation accounts (need a free D-U-N-S
  number) skip that rule and show the company as developer.
- **Reviewer test accounts:** create one working realtor login and one client login
  on the live backend for Google's reviewers.

## Step 1 — Create the app and upload the `.aab`

1. Play Console → **Create app**: name `Kemchuta Homes`, English, App, Free, accept declarations.
2. **Test and release → Testing → Closed testing** → create/use a track.
3. **Create new release** → choose **"Use Google-generated key"** (Play App Signing).
4. Upload `app-release.aab`. Release name `1.0.0 (1)`, add release notes.
5. Track **Countries/regions** → add Nigeria (and any others).
6. **Save → Review release** (rollout unlocks once Step 2 is complete).

## Step 2 — App content (Policy → App content)

| Section | Entry |
|---|---|
| Privacy policy | `https://kemchutahomesltd.com/privacy` |
| App access | Restricted → add realtor + client test logins with instructions |
| Ads | No ads |
| Content rating | "All other app types"; No to violence/sexual/gambling; AI chat is not user-to-user |
| Target audience | 18+ only; does not appeal to children |
| News app | No |
| Advertising ID | No |
| Government app | No |
| Financial features | Select honestly — plot subscriptions/instalments via Paystack, Buy2Sell investments, realtor commissions |
| Health | None |
| Account deletion URL | `https://kemchutahomesltd.com/delete-account` |

### Data safety

- Collects data: **Yes** · Encrypted in transit: **Yes** · Deletion request: **Yes** (URL above)

| Data type | Collected | Shared | Required | Purposes |
|---|---|---|---|---|
| Name | ✅ | ❌ | Required | Account management, App functionality |
| Email address | ✅ | ❌ | Required | Account management, App functionality, Communications |
| Phone number | ✅ | ❌ | Required | Account management, App functionality, Communications |
| Address | ✅ | ❌ | Required for subscriptions | App functionality |
| Other info (DOB, gender, next of kin, state, referral code) | ✅ | ❌ | Required | Account management, App functionality |
| Purchase history | ✅ | ❌ | Required | App functionality, Account management |
| Other financial info (realtor bank details) | ✅ | ❌ | Required for realtors | App functionality |
| Other in-app messages (AI chat, processed ephemerally) | ✅ | ❌ | Optional | App functionality |

Not declared (not used by the app today): location, contacts, photos, files,
device IDs, crash logs, app activity. Card details are entered on Paystack's page,
not in the app. Service providers processing data on your behalf don't count as
"sharing". **Update this form if push notifications or photo uploads are added.**

### Store listing (Grow → Store presence → Main store listing)

- Name `Kemchuta Homes` (≤30) · short description (≤80) · full description (≤4000)
- Icon 512×512 PNG · feature graphic 1024×500 · 2–8 phone screenshots (9:16)
- Category: House & Home · Contact: `support@kemchutahomesltd.com`, `https://kemchutahomesltd.com`

## Step 3 — Testers and the 14-day closed test

1. Closed testing track → **Testers** → create an email list with 12+ Gmail addresses.
2. Copy the **opt-in link** and send it to testers; each opens it on their Android
   phone's Google account, taps **Become a tester**, then installs from Play.
3. **Start rollout to Closed testing** (first review: hours to a few days).
4. Keep all 12+ testers opted in for **14 consecutive days** and ask them to use the app.
5. Then **Dashboard → Apply for production**, answer the testing questions, and
   promote the release to Production.

## Step 4 — `assetlinks.json` (after the first upload)

1. Play Console → **Setup → App signing** → copy the **App signing key certificate**
   SHA-256 (Google's key — not the upload key above).
2. Add to the website at `client/public/.well-known/assetlinks.json` and deploy:
   ```json
   [{
     "relation": ["delegate_permission/common.handle_all_urls"],
     "target": {
       "namespace": "android_app",
       "package_name": "com.kemchutahomes.mobile",
       "sha256_cert_fingerprints": ["<APP SIGNING KEY SHA-256 FROM PLAY>"]
     }
   }]
   ```
3. Confirm `https://kemchutahomesltd.com/.well-known/assetlinks.json` returns the JSON.

## Open items for build 2

- Remove unused permissions: CAMERA, READ_MEDIA_IMAGES, RECORD_AUDIO,
  SYSTEM_ALERT_WINDOW, READ/WRITE_EXTERNAL_STORAGE (none are used by the code).
- Fix the 4 TypeScript errors (incl. `Colors.goldBg` in `Badge.tsx`).
- Add a Report option to the AI chat (Play generative-AI policy).
- Hide the admin "Reports — Coming Soon" screen.
- Push notifications: needs a Firebase project + token registration.
