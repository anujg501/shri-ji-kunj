# Shri Ji Kunj — family & guest app

A mobile web app for booking the flat at Goverdhan Eco Village (F 11-103, Goverdhan Kunj).
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
- `src/data/model.ts` holds the six family members, their colours, and the phone numbers linked to them (`KNOWN_PHONES`).
- `src/data/store.ts` holds the bookings store. It is the only place to change when connecting a server.
- `src/data/links.ts` builds guest links and WhatsApp messages.

## What is real and what is simulated

| Feature | Status |
|---|---|
| Calendar, blocking and unblocking, overlap warning | ✅ Works on the device it is used on |
| Guest link | ✅ Works on the guest's own phone. The stay details are packed into the link, and the guest's mobile number is left out. |
| "Send on WhatsApp" to guest | ✅ Opens WhatsApp with the message ready to send |
| **Shared calendar across family phones** | ⚠️ Not yet. Bookings are saved on each phone separately until a server is connected. |
| OTP by SMS | ⚠️ Simulated: any 4 digits work |
| WhatsApp alert to the other member on overlap | ✅ One tap opens WhatsApp with the message ready. Add members' numbers to `WHATSAPP` in `model.ts`; without a number, WhatsApp asks who to send it to. |

### Next step: make the calendar shared

Connect `src/data/store.ts` to a hosted database such as **Supabase** (free tier, Postgres with realtime updates and phone OTP built in) or **Firebase**:

1. Create a `bookings` table with the fields from the `Booking` type in `model.ts`.
2. In `store.ts`, load bookings from the table and subscribe to realtime changes, instead of using `localStorage`.
3. Turn on Supabase phone sign-in, with an SMS provider such as Twilio or MSG91, to replace the simulated OTP.

## Content still to confirm (from the design chat)

- Darshan timings are drafts.
- The e-bike charging card still has the designer's draft steps.
- The GEV reception number is missing.
- Family members' WhatsApp numbers (only Anuj prabhu's is set) for overlap alerts.
- The door code is visible to anyone who has a guest link. Update `StayInfo.tsx` whenever the code changes.
