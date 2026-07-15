# RG Coach — App Store privacy answers

Use this inventory for App Store Connect version 1.0. It describes the current production mobile code, Supabase data model, and external RevenueCat/Stripe checkout.

## Tracking

- Data used to track users across apps or websites: **No**
- Advertising or advertising SDKs in the mobile app: **No**

## Data collected and linked to the user

All items below are used for **App Functionality** and are linked to the signed-in client account. They are not used for third-party advertising.

| App Store category | Data type | Current use |
| --- | --- | --- |
| Contact Info | Name | Identify the client and personalize their private workspace |
| Contact Info | Email Address | Authentication, account administration, and support |
| Identifiers | User ID | Scope Supabase records to the correct client |
| Health & Fitness | Fitness | Workout plans, exercises, program stage, habits, and adherence |
| Health & Fitness | Health | Nutrition targets and meal-plan information |
| Purchases | Purchase History | Purchased, remaining, expired, and consumed session credits |
| Location | Coarse Location | Agreed gym/building location for an upcoming live session, when supplied |
| User Content | Other User Content | Coaching records and daily habit completion stored for the client |

## Data not collected by the mobile app

- Full payment card details: RevenueCat Billing and Stripe handle checkout outside the app; RG Coach does not receive the full card number.
- Precise device location, contacts, microphone, camera, and photo library.
- Device or advertising identifiers for tracking.
- Diagnostics, crash logs, or mobile analytics through a third-party SDK in the current release.
- Photos, body measurements, or weight in the current release.

## Public and in-app disclosures

- English privacy policy: https://rubengomezcoaching.com/privacy
- Spanish privacy policy: https://rubengomezcoaching.com/privacidad
- English purchase terms: https://rubengomezcoaching.com/purchase-terms
- Spanish purchase terms: https://rubengomezcoaching.com/terminos-compra
- Data access/deletion: available inside **Profile**, opening an email request to rubengomezesp@gmail.com.

Review this file whenever a new SDK, permission, tracking feature, progress photo, measurement, or health-data integration is added. App Store privacy answers must be updated before that version is submitted.
