-- Apply once to the private PostgreSQL database before deploying this feature.
-- No anonymous/public database role should have access to either table.
BEGIN;
CREATE TABLE IF NOT EXISTS ttod_bookings (
  id uuid PRIMARY KEY,
  reference text NOT NULL UNIQUE,
  fingerprint text NOT NULL,
  payload jsonb NOT NULL,
  requested_timing jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  notification_status text NOT NULL DEFAULT 'pending'
    CHECK (notification_status IN ('pending', 'sending', 'sent', 'failed')),
  notification_payload jsonb,
  email_id text,
  first_attempt_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  lease_token uuid,
  lease_until timestamptz
);
CREATE INDEX IF NOT EXISTS ttod_bookings_fingerprint_created
  ON ttod_bookings (fingerprint, created_at DESC);
CREATE TABLE IF NOT EXISTS ttod_booking_requests (
  request_key text PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES ttod_bookings(id) ON DELETE CASCADE,
  fingerprint text NOT NULL
);
ALTER TABLE ttod_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ttod_booking_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ttod_bookings, ttod_booking_requests FROM PUBLIC;
COMMIT;
