# Private booking storage setup

This feature must not replace the current production deployment until the database
is connected and the migration is applied. No production resource is provisioned
by this branch.

1. Attach a private PostgreSQL database to the existing Vercel project. Review the
   provider's costs, backup options and region before provisioning. Use a dedicated
   database for this application.
2. Apply `001-bookings.sql` using the database's SQL console as the table owner.
   It creates two application tables and enables row security with no public
   policies. The server connection must use the owner or an appropriate private
   backend role that bypasses row security. Never use an anonymous client key.
3. Add the provider's TLS-enabled connection URL as server-only `DATABASE_URL`
   (or `POSTGRES_URL`) in Vercel. Do not put it in a `NEXT_PUBLIC_` variable,
   source code, logs, or chat. Leave the existing Resend variables in place.
4. Use separate storage for preview deployments. Validate on preview with a
   controlled request before deploying production. Automated tests use embedded
   PostgreSQL and mocked Resend; they do not test the live provider connection.
5. Verify one row, matching reference and pickup schedule, one email, and a retry
   with the same reference. Inspect notification status in the private database
   console. There is no public records endpoint or new admin dashboard.

## Behavior

- The record includes contact and vehicle details, addresses/pin, quote, mileage,
  Central pickup schedule, language, consent, creation time and email status.
- A request key always reuses its original record. Different keys with identical
  normalized details within ten minutes also reuse the record. Different details
  with a previously used key return a conflict.
- Each email uses a frozen payload and one Resend idempotency key. Concurrent
  attempts are limited by a sixty-second database lease. An interrupted attempt
  may be retried once the lease expires. Retry uses the same payload even if
  notification settings change.
- If saving fails, no email is attempted and no confirmation is shown. If email
  fails, the saved reference is shown with a retry/call message. The original
  record is retained. There is no automatic background retry worker.
- An unresolved notification older than 23 hours requires manual review in the
  provider's email logs. Check for an existing delivery before sending manually;
  automatic retry stops before the provider's 24-hour deduplication window ends.
- A `sent` notification means Resend accepted it, not that inbox delivery or
  dispatch is guaranteed. Delivery webhook tracking is outside this change.
- Configure provider backups and an appropriate retention policy before launch.
  Delete a booking by ID to remove both the record and its request-key aliases.
  Existing emails are not imported into the database.

Do not disable saving as an automatic fallback: that would silently lose the
booking guarantee. If rollout fails, restore the prior working deployment while
fixing the connection. Keep the private database so saved requests remain intact.
