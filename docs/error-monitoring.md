# Error Monitoring

## Purpose

CCAD HQ records enough information to find and diagnose unexpected failures
without turning application logs into a second copy of studio data.

## Monitoring Layers

- Next.js `instrumentation.ts` writes structured server incidents to deployment
  runtime logs.
- Client instrumentation records uncaught browser errors and promise
  rejections.
- Workspace and global error boundaries show a recovery action and incident ID.
- Authenticated browser incidents create a lightweight
  `application_incidents` database record.
- Supabase platform logs remain the source for database, Auth, API, and Realtime
  failures.

## Database Incident Record

Database incident records contain only:

- Incident ID
- Organization and member attribution
- Source and route
- Next.js digest when available
- Deployment ID when available
- Timestamp

They do not contain error messages, stack traces, request headers, form values,
tokens, or request bodies. Admins may read incident references. Inserts occur
only through an authenticated, membership-checking database function.

## Runtime Log Rules

- Use structured JSON with an incident ID.
- Never log passwords, authentication tokens, cookies, confirmation or recovery
  links, finance notes, task
  descriptions, focus descriptions, or request bodies.
- Error messages and stack traces may be written to server runtime logs only.
- Use the incident ID or Next.js digest to connect a user-visible failure to
  runtime logs.
- Crash reporting must never interrupt recovery or make the original failure
  worse.

## Retention And External Monitoring

Vercel Runtime Logs are suitable for initial server diagnostics but have limited
retention. Before public launch, connect a dedicated error-monitoring service or
Vercel Log Drain with equivalent redaction rules.

Supabase logs remain in Supabase and follow the retention of the selected
Supabase plan. Application incidents are retained with other append-only
operational history until a formal retention policy is approved.
