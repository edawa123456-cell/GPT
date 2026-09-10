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

## What is not connected yet

- Customer name/phone checkout step
- SMS confirmation to customer
- SMS/email notification to owner
- Booking database
- Payment

Those should be the next build phase after the real address and mileage calculation is verified.
