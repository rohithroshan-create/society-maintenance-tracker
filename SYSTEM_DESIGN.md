# System Design Write-up

## Complaint history model

A complaint's `status` and `priority` live directly on the `Complaint`
row, but every *change* to status is additionally written to a
separate, append-only `StatusHistory` table — never updated, never
deleted. Each history row captures the new status, an optional note,
who made the change (`actorId`, `actorName`, `actorRole`), and a
timestamp. The complaint itself always carries its first history
entry ("Complaint raised by resident") created in the same request
that creates the complaint, so every complaint has a history from
second zero.

This is a log, not a mutable audit column, for two reasons. First, it
is the only way to answer "what happened, in what order, and who did
it" — a single `updatedAt` timestamp on the complaint can't tell you
whether it went Open → In Progress → Open → Resolved or something
else entirely, which matters for a system whose whole point is
accountability. Second, it composes cleanly with the rest of the
schema: the resident's timeline view, the admin's audit trail, and the
status-change email are all driven by the exact same rows, so there is
one source of truth instead of three. Once a complaint reaches
`Resolved` the API refuses further status writes (`400` from
`PATCH /complaints/:id/status`), which closes the complaint without
needing a separate `closed` boolean — "Resolved" *is* closed.

## Overdue detection

Overdue is deliberately **not** a stored field. It's computed at read
time: a complaint is overdue if its status isn't `Resolved` and
`now - createdAt` exceeds a threshold held in a single-row `Config`
table (`overdueThresholdDays`, admin-editable through the dashboard).

The alternative — a cron job that flips an `overdue` flag once a day —
was rejected for two reasons. It introduces a background process the
assignment doesn't otherwise need, and it goes stale the moment an
admin changes the threshold: every existing complaint would need a
re-scan before the numbers were trustworthy again. Computing it live
means changing the threshold from 5 to 3 days instantly reclassifies
every complaint on the very next request, with no migration and no
lag. The cost is a cheap per-row comparison at read time, which is
negligible at society scale (hundreds, not millions, of complaints).
The admin's complaint list applies this same function server-side and
sorts overdue complaints to the top before paginating, so "what needs
attention right now" is always the first thing the office sees.

## Photo handling

Photos are optional, single-file, and attached at creation time via
`multipart/form-data` (a resident can't attach a photo after the fact,
which keeps the upload path — and its validation — in exactly one
place). `multer` writes the file to disk with a randomized filename
(timestamp + random hex, extension preserved) rather than the
resident's original filename, which avoids both path-traversal tricks
and filename collisions. The middleware whitelists five extensions
(`jpg/jpeg/png/webp/gif`) and caps size at 5MB before the request body
is even fully parsed, so bad uploads are rejected cheaply. The
`Complaint` row stores only a relative URL (`/uploads/<file>`); the
API serves that path statically, and the frontend resolves it against
the API's base URL. This keeps the database free of binary data and
makes the storage backend swappable — moving from local disk to S3
later only touches the upload middleware, not the schema or any
route.

## Notification flow

Two events trigger email: a complaint's status changing, and an
admin posting a notice marked *important*. Both go through one small
`sendMail` utility wrapping `nodemailer`, which is intentionally
fail-open — if SMTP env vars are absent, or the send throws, the
function logs the attempt and returns rather than raising. This
matters because email is a side effect of the *real* action (updating
a status, posting a notice), and a flaky mail provider should never
be able to block or roll back a status update the admin has already
committed. Emails are dispatched asynchronously after the database
write succeeds and the API has already responded, so a slow SMTP
provider never adds latency to the admin's click. Status-change mail
goes to exactly the complaint's resident, addressed by name, and
includes the ticket number and any admin note. Important notices fan
out to every resident individually (not a single BCC blast), so each
email is personalized and no resident's address is exposed to
another. Non-important notices intentionally don't email anyone —
they're for the board, not the inbox, which keeps the "important"
flag meaningful instead of diluted.
