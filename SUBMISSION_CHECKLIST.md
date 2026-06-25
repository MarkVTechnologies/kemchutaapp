# KHL Mobile — App Store Submission Checklist

## Before building

### EAS setup (one-time)
- [ ] Run `npx eas login` with Apple ID: bamidelebenjamin5@gmail.com
- [ ] Run `npx eas init` to get an EAS Project ID
- [ ] Replace `YOUR_EAS_PROJECT_ID` in `app.json` → `extra.eas.projectId` and `updates.url`
- [ ] Run `npx eas credentials` to configure iOS signing (auto-managed recommended)
- [ ] Run `npx eas credentials` for Android (auto-managed — EAS generates keystore)

### App Store Connect (iOS)
- [ ] Create app in App Store Connect at appstoreconnect.apple.com
- [ ] App name: **Kemchuta Homes**
- [ ] Bundle ID: `com.kemchutahomes.mobile`
- [ ] Primary language: English (Nigeria preferred, else English US)
- [ ] Category: **Finance** (primary), Real Estate (secondary if available)
- [ ] Fill in `ascAppId` in `eas.json` → `submit.production.ios.ascAppId`
- [ ] Fill in `appleTeamId` from your Apple Developer account

### Google Play (Android)
- [ ] Create app in Google Play Console
- [ ] Package name: `com.kemchutahomes.mobile`
- [ ] Generate a service account key → save as `google-service-account.json` (gitignored)
- [ ] Set category: Finance

### Assets — must replace before production build
- [ ] `assets/icon.png` — 1024×1024 PNG, no transparency, no rounded corners
- [ ] `assets/adaptive-icon.png` — 1024×1024 PNG, centered on safe area, transparent bg OK
- [ ] `assets/splash.png` — 1284×2778 PNG (iPhone 14 Pro Max size), logo centered
- [ ] `assets/notification-icon.png` — 96×96 PNG, white on transparent (Android)
- [ ] `assets/favicon.png` — 48×48 PNG (web)

## Build commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Development build (simulator / dev client)
eas build --profile development --platform ios
eas build --profile development --platform android

# Internal preview build (TestFlight / internal track)
eas build --profile preview --platform all

# Production build
eas build --profile production --platform all

# Submit to stores (after production build)
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

## OTA updates (after launch)

```bash
# Publish a JS-only update (no native changes needed)
eas update --channel production --message "Fix: ..."
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | Yes | Backend API URL |
| `EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY` | Yes | Paystack publishable key |

## App Store listing content

**Short description (80 chars):**
> Kemchuta Homes — Buy, invest, and track real estate in Nigeria

**Full description:**
> Kemchuta Homes Limited connects Nigerians to premium real estate opportunities. Whether you're a prospective buyer, an active realtor, or a property investor, the KHL app gives you a streamlined experience to:
>
> • Browse premium estate listings with detailed plot maps and payment plans
> • Book property inspections directly from your phone
> • Track your subscription status and payment milestones
> • Realtors: monitor commissions, recruits, and your referral network
> • Clients: download your contracts, invoices, and allocation letters
> • AI-powered property assistant for instant answers

**Keywords:** real estate, Nigeria, property, land, subscription, realtor, investment, kemchuta

**Privacy Policy URL:** https://kemchutahomesltd.com/privacy
**Support URL:** https://kemchutahomesltd.com/support
**Marketing URL:** https://kemchutahomesltd.com
