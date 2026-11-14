/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export default [
  ['plugin_dbadmin_session_manager', 'Sitzungsmanager'],
  ['plugin_dbadmin_lock_manager', 'Sperrenmanager'],
  ['plugin_dbadmin_show_idle_sessions', 'Inaktive Sitzungen anzeigen'],
  ['plugin_dbadmin_cancel_query', 'Abfrage abbrechen'],
  ['plugin_dbadmin_cancel_query_confirm', 'Laufende Abfrage in {arg:count} ausgewählten Sitzung(en) abbrechen?'],
  ['plugin_dbadmin_cancel_query_error', 'Abfrage konnte nicht abgebrochen werden'],
  ['plugin_dbadmin_terminate_session', 'Sitzung beenden'],
  [
    'plugin_dbadmin_terminate_session_confirm',
    '{arg:count} ausgewählte Sitzung(en) beenden? Nicht festgeschriebene Änderungen werden zurückgesetzt.',
  ],
  ['plugin_dbadmin_terminate_session_error', 'Sitzung konnte nicht beendet werden'],
  ['plugin_dbadmin_terminate_waiting_session', 'Wartende Sitzung beenden'],
  [
    'plugin_dbadmin_terminate_waiting_session_confirm',
    'Sitzung {arg:sessionId} beenden? Ihre nicht festgeschriebenen Änderungen werden zurückgesetzt.',
  ],
  ['plugin_dbadmin_no_sessions', 'Keine Sitzungen'],
  ['plugin_dbadmin_no_locks', 'Keine Sperrwartezustände'],
  ['plugin_dbadmin_no_lock_items', 'Keine Sperren'],
  ['plugin_dbadmin_query', 'Abfrage'],
  ['plugin_dbadmin_waiting_session_locks', 'Wartende Sitzung'],
  ['plugin_dbadmin_blocking_session_locks', 'Blockierende Sitzung'],
  ['plugin_dbadmin_not_connected', 'Verbinden Sie sich mit der Datenbank, um Sitzungen und Sperren zu sehen.'],
];
