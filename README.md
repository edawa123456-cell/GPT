# Tow Truck On Demand — Version 2

Next.js website update based on the current GitHub/Vercel preview.

## Pricing now built in

- Hookup: $80
- Mileage: $7 per mile starting at mile 1
- Mileage is rounded UP to the next whole mile
- Minimum tow charge: $100
- SUV: +$15
- Pickup: +$15
- Vehicle does not roll: +$40
- After-hours: +$60
- Business hours: Monday-Saturday, 8:00 AM-6:00 PM
- Sunday is after-hours

## Google address + mileage setup

This version is ready for Google Places address suggestions and Google Routes driving mileage.

In Vercel, add these Environment Variables:

1. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — browser key for address autocomplete
2. `GOOGLE_MAPS_API_KEY` — server key for route mileage

Enable the following APIs in Google Cloud:

- Maps JavaScript API
- Places API
- Routes API

After adding the variables, redeploy the project.

## Booking records and notifications

Booking requests are validated on the server and emailed through Resend. This branch
also saves requests to private PostgreSQL storage before sending the notification,
assigns a booking reference, and protects against repeated submissions.

**Deployment prerequisite:** follow [database setup](database/README.md) before
merging/deploying this feature. SMS and online payments are not implemented.

Run `npm ci`, `npm test`, and `npm run build` to validate locally.
