# Shri Ji Kunj — family & guest app

A mobile web app for booking the flat at Goverdhan Eco Village (F 11-103, Goverdhan Kunj).
**Live at https://shrijikunj.netlify.app** (Netlify project `shrijikunj`, Gra Moissanite Team).

It is built from the Claude Design handoff in `../project/Shri Radha Kunj App.dc.html`.
It can be added to a phone's home screen and then works like an installed app.

## Pages

| Address | Who uses it | What it is |
|---|---|---|
| `/#/` | Family | Sign in, shared calendar, My stays, Stay info |
| `/#/stay/<id>?d=…` | Guests | The link a family member shares. Opens on the stay, no sign-in needed. |
| `/#/preview` | You | Both phones side by side, laid out like the design canvas |

## Run it locally

```bash
cd app
npm install
npm run dev        # opens on http://localhost:5173
npm run build      # production files go to app/dist/
```

## Put it online

The app is hosted on **Netlify**, the same account as the gra-moissanite site. `netlify.toml` at the repository root holds all the build settings: in Netlify choose **Add new site → Import an existing project → GitHub → shri-ji-kunj** and click **Deploy**. Every push to `main` then updates the live app automatically.
Once it is live, family members open the address on their phone and choose **Add to Home Screen**.

## Where things live

- `src/components/StayInfo.tsx` holds every guest-facing text: address, door code, Wi-Fi, darshan times, transport, check-out and emergency contacts. Edit text here.
- `src/data/model.ts` holds the six family members: names, colours and mobile numbers.
- `src/data/store.ts` is the only file that talks to the database, covering bookings, sign-in and guest lookups.
- `src/config.ts` holds the database address and key.
- `supabase/schema.sql` creates the database tables and security rules.

## Database and sign-in

The app uses the **GRA Moissanite Supabase project**, on purpose: the family reuses its working SMS sign-in, which already has TRAI DLT approval. Everything the family uses lives in separate tables named `sjk_…`. Nothing belonging to GRA is changed or read.

- Only the six family numbers can sign in or see bookings.
- Each member can add stays under their own name and remove only their own.
- **Admin (Anuj prabhu):** can also remove anyone's stay (from its day on the calendar) and clear every booking (My stays → Admin). Set by `is_admin` in `schema.sql`; `admin` in `model.ts` only decides what the app shows.
- **First come, first served:** once a date is booked, nobody else can book it. The app politely declines, and the database refuses it too, even if two people confirm at the same moment.
- Guests aren't signed in. A guest link can read only its own stay, without any phone numbers.

**One-time setup:** open Supabase → **SQL Editor** → **New query**, paste all of `supabase/schema.sql`, and click **Run**. Run it again whenever a family member's number changes; it is safe to run more than once.

The SMS code is 6 digits, because the length is a project-wide setting shared with GRA. It reads "Dear Customer Your Login otp is …", which is the approved DLT template wording.

**Test mode:** `VITE_LOCAL_MODE=1 npm run dev` keeps everything in the browser and accepts any 4-digit code. It is for design work only.

## What works

| Feature | Status |
|---|---|
| Shared calendar, live on every family phone | ✅ |
| SMS sign-in, family numbers only | ✅ |
| Blocking and unblocking, first come first served | ✅ |
| Guest link | ✅ Works on the guest's own phone. It stops working once the stay is unblocked. |
| "Send on WhatsApp" to the guest | ✅ Opens WhatsApp with the message ready |

## Content still to confirm (from the design chat)

- Darshan timings are drafts.
- The e-bike charging card still has the designer's draft steps.
- The GEV reception number is missing.
- The door code is visible to anyone who has a guest link. Update `StayInfo.tsx` whenever the code changes.
