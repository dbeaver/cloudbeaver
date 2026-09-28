# Device authorization: required backend behavior

The frontend and GraphQL contract are ready for the behavior below. The server
implementation must be aligned separately before enabling subscription access.

## User-scoped profiles

- Authentication selection and credentials belong to the **current user × profile**.
  The administrator owns the shared profile, engine, model, and scope.
- `accountProvider` advertises working headless Device Auth, independently of the
  active method. Initially return `ChatGPT` for supported OpenAI engines and null
  for global profiles, unsupported engines, and Grok.
- `tokenSaved` and `account` describe each credential independently of the active
  method. A connected account without an email is still an object, not null.
- `accountAuthentication` defaults to false. `credentialsSaved` reports credentials
  for the selected method, not validated provider access.
- Saving a method preserves both credentials. Omitted properties remain unchanged;
  an empty token deletes only the token. Reject selecting an unconfigured method.
  Apply credentials and method changes atomically.

## Device Auth and disconnect

- Start works regardless of the shared profile's authentication setting. Return
  the user code, HTTPS verification URI, validity period, and async task information.
- The server polls the provider and handles code expiry. Completion saves the
  account and selects subscription access before returning `taskResult: true`.
  The frontend marks this profile outdated and continues the pending chat action;
  consumers reload profile metadata through the normal resource flow.
- Failure, expiry, and cancellation preserve the previous credentials and method.
  Closing the UI or changing user cancels via `asyncTaskCancel`, including when
  the start response arrives late. Cancellation and newer attempts must prevent
  stale provider responses from saving credentials.
- Disconnect clears only account credentials and pending authorization, preserving
  the API token and active method. The user disconnects before linking another account.

## Chat errors

Use `AI_ACCOUNT_AUTHENTICATION_REQUIRED` in `ServerError.errorCode` (or GraphQL
`extensions.webErrorCode`) when stored subscription credentials cannot be refreshed.
For asynchronous failures, also include it in the chat error event and persisted
`AIMessage.errorCode`. The UI offers an explicit action to open credentials.
Model, quota, entitlement, and network errors keep their original messages.

Subscription access ignores API Base URL and uses the administrator-selected
model. Never silently switch the model, authentication method, or API billing.

Integration checks still needed: real provider login, persistence, server-side
cancellation, error-code delivery, and browser/screen-reader verification in both
entry points.
