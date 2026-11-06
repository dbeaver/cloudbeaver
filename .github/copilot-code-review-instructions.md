# Code Review

## Security Review

Review every pull request for security issues in the changed code and its direct
call paths. Report only actionable findings introduced by the pull request,
including the affected file and line, attack scenario, and remediation.

Apply the project base security rules for Java and TypeScript code. Treat input
from users, database contents, configuration, imported projects, model output,
archives, files, URLs, and remote services as untrusted.

Pay particular attention to:

- SQL, LDAP, shell, file-path, URL, XML, GraphQL, regex, and deserialization
  inputs that may be controlled by users, database contents, configuration, or
  remote services.
- Authentication, authorization, permission checks, unsafe default access, and
  broken function-level authorization. Backend APIs and GraphQL mutations must
  enforce permissions and global security settings; UI checks are not enough.
- State-changing operations exposed through `GET`, missing CSRF protection for
  cookie-authenticated requests, and GraphQL queries or mutations accepted over
  unsafe methods.
- Internal, administrative, local, or service-to-service endpoints that are
  unauthenticated, exposed to the network, or missing authorization checks.
- Secret, token, password, private key, connection string, IPC secret, session
  cookie, license data, or personal-data exposure in code, tests,
  configuration, logs, exceptions, or documentation.
- Unsafe handling of credentials and database connection settings.
- Missing validation, encoding, escaping, canonicalization, containment checks,
  or resource limits.
- Insecure temporary files, archive extraction, redirects, TLS configuration,
  and external-process execution.
- Path traversal and unsafe file handling. Normalize paths, reject absolute
  paths, `..`, UNC or network paths, unsafe `file://` links, and archive entries
  that escape the target directory. Enforce containment in the expected base
  directory before reading, writing, opening, or deleting files.
- Injection risks caused by string-built SQL, LDAP filters, shell commands,
  cron entries, JEXL expressions, templates, scripts, or connection events. Use
  parameterized queries, proper escaping, strict validation, or sandboxing.
- XSS in HTML, Markdown, copied output, popups, table data, WebViews, and data
  rendered from AI or model output. Encode or sanitize untrusted content and
  block raw HTML, script execution, `javascript:` links, and unsafe local-file
  access.
- Unsafe JavaScript bridges or WebViews that expose local files, credentials,
  IPC secrets, shell execution, or privileged application actions to untrusted
  content.
- XML processing without secure parser settings. Disable DTDs, external
  entities, external schemas, and unsafe default XML parser behavior; enable
  secure processing for DOM, SAX, StAX, transformers, minifiers, formatters,
  compactors, database drivers, imports, and data viewers.
- SSRF through server-side URL validation, JDBC connection creation,
  deployment validation, callbacks, redirects, or remote resource loading. Use
  strict allowlists and block localhost, private networks, link-local ranges,
  metadata services, and internal hosts unless explicitly required and
  authorized.
- Regex patterns that may cause catastrophic backtracking or denial of service.
  Prefer safe patterns, bounded input sizes, timeouts, or non-regex parsers.
- Unsafe imports, shared projects, scheduled tasks, and exports. Treat imported
  project data as untrusted, do not auto-run scripts or connection events, and
  sanitize CSV or spreadsheet exports to prevent formula injection.

Do not report speculative concerns without a realistic attack path. Do not
request broad refactoring when a focused fix is sufficient.

## Interface Text

Review changed user-visible interface text for punctuation and tone. Apply
these rules to titles, headings, labels, controls, commands, messages,
descriptions, and helper text. Do not apply them to technical documentation or
release notes unless the text is presented in the interface.

### Periods

Do not use periods in titles, headings, labels, controls, commands, or other
text that names an interface element or action. In messages, descriptions, and
other explanatory prose, use normal sentence punctuation: end complete
sentences with a period, including standalone messages, and do not add a
period to a fragment.

### Colons

Use a colon after a label that introduces an input field or a group of radio
buttons or checkboxes. Do not use a colon when the label and the text inside
the field form a single phrase.

### Contractions

Do not use contractions in interface text. Write words in full, such as `The
connection cannot be established` rather than `The connection can't be
established`. Contractions are acceptable in longer reading-oriented content,
such as release notes.

### Question Marks

Use a question mark only in a confirmation alert that asks a direct question.
Do not use questions in commands, links, labels, helper text, or informational
messages; rewrite them as commands or statements.

### Exclamation Points

Do not use exclamation points in interface text.

Report only clear violations introduced by the pull request and suggest the
correct user-visible wording.