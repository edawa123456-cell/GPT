# TowTruckOnDemand analytics

Uses the existing GA4 stream `G-98RWTMRG0V`. No new analytics provider or subscription is added. The existing Google Ads conversion remains separate and fires only after a successful request response.

## Booking funnel

| Event | Meaning |
| --- | --- |
| `quote_start` | First interaction with the booking area on a page load |
| `quote_request` | Valid quote details sent for route calculation |
| `quote_view` | Route calculation succeeded and price is displayed |
| `booking_start` | Customer opens the contact/request form |
| `booking_attempt` | Valid request submitted to the server |
| `generate_lead` | Server accepted the request; confirmation displayed |
| `quote_error`, `booking_error` | Route/request failed (no raw errors sent) |
| `phone_click` | A phone link was clicked; does not prove a completed call |
| `social_click` | Facebook or Instagram link clicked |
| `content_scroll` | 50% or 90% of the available scroll distance reached |

Custom events go only to GA4, not the Ads destination. Allowlisted event parameters: `site_language`, `pickup_timing`, `vehicle_type`, `referral_partner`, `social_network`, `percent_scrolled`. No names, phone numbers, addresses, GPS pins, vehicle descriptions, scheduled dates, request payloads or raw error messages are sent by this custom event code. Existing Google tag pageview/session attribution remains in place.

## Dashboard setup still required

Use the Google account with access to this measurement ID. Verified account: towtruckondemand@gmail.com; Analytics account 411909376, property 558850937 (TowTruckOnDemand Website). The previous ID had two letters transposed and was corrected after checking the live property's ID.

1. Verify the data stream's measurement ID, Realtime and DebugView.
2. Mark `generate_lead` as a key event (once per event). Do not also import it into Ads as another primary conversion alongside the existing Ads request conversion, which would double-count bookings.
3. Register event-scoped custom dimensions for `site_language`, `pickup_timing`, `vehicle_type`, `referral_partner`, and `social_network` if these breakdowns are needed.
4. Use Reports → Acquisition → Traffic acquisition for session source/medium and campaigns. Use Pages and screens for page usage. Create a funnel exploration with `quote_start` → `quote_view` → `booking_start` → `generate_lead`.
5. Check enhanced measurement settings: automatic form events may include focus/submit attempts and should not be treated as successfully received requests. Only `generate_lead` represents success in this custom funnel.

For incoming social traffic, set the website links on the business profiles to:

- Facebook: `https://www.towtruckondemand.com/?utm_source=facebook&utm_medium=organic_social&utm_campaign=profile`
- Instagram: `https://www.towtruckondemand.com/?utm_source=instagram&utm_medium=organic_social&utm_campaign=profile`

These are incoming links for the social profiles, not the website's outgoing social buttons. Updating Facebook/Instagram profiles has not been performed. Partner links retain their existing `?ref=partner-slug` format; `referral_partner` supplements GA4 acquisition and does not rewrite GA4's source/medium.

Ad blockers, browser restrictions and consent settings can limit analytics. Historical funnel events cannot be reconstructed. Do not send real bookings solely to test analytics without coordinating the test.
