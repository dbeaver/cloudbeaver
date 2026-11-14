/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export default [
  ['plugin_dbadmin_session_manager', 'Session Manager'],
  ['plugin_dbadmin_lock_manager', 'Lock Manager'],
  ['plugin_dbadmin_show_idle_sessions', 'Show idle sessions'],
  ['plugin_dbadmin_cancel_query', 'Cancel query'],
  ['plugin_dbadmin_cancel_query_confirm', 'Cancel the running query in {arg:count} selected session(s)?'],
  ['plugin_dbadmin_cancel_query_error', 'Failed to cancel the query'],
  ['plugin_dbadmin_terminate_session', 'Terminate session'],
  ['plugin_dbadmin_terminate_session_confirm', 'Terminate {arg:count} selected session(s)? Uncommitted changes in them are rolled back.'],
  ['plugin_dbadmin_terminate_session_error', 'Failed to terminate the session'],
  ['plugin_dbadmin_terminate_waiting_session', 'Terminate waiting session'],
  ['plugin_dbadmin_terminate_waiting_session_confirm', 'Terminate session {arg:sessionId}? Its uncommitted changes are rolled back.'],
  ['plugin_dbadmin_no_sessions', 'No sessions'],
  ['plugin_dbadmin_no_locks', 'No lock waits'],
  ['plugin_dbadmin_no_lock_items', 'No locks'],
  ['plugin_dbadmin_query', 'Query'],
  ['plugin_dbadmin_waiting_session_locks', 'Waiting session'],
  ['plugin_dbadmin_blocking_session_locks', 'Blocking session'],
  ['plugin_dbadmin_not_connected', 'Connect to the database to see sessions and locks.'],
];
