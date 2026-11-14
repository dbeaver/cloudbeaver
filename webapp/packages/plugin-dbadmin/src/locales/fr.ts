/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export default [
  ['plugin_dbadmin_session_manager', 'Gestionnaire de sessions'],
  ['plugin_dbadmin_lock_manager', 'Gestionnaire de verrous'],
  ['plugin_dbadmin_show_idle_sessions', 'Afficher les sessions inactives'],
  ['plugin_dbadmin_cancel_query', 'Annuler la requête'],
  ['plugin_dbadmin_cancel_query_confirm', 'Annuler la requête en cours dans {arg:count} session(s) sélectionnée(s) ?'],
  ['plugin_dbadmin_cancel_query_error', "Impossible d'annuler la requête"],
  ['plugin_dbadmin_terminate_session', 'Terminer la session'],
  ['plugin_dbadmin_terminate_session_confirm', 'Terminer {arg:count} session(s) sélectionnée(s) ? Les modifications non validées seront annulées.'],
  ['plugin_dbadmin_terminate_session_error', 'Impossible de terminer la session'],
  ['plugin_dbadmin_terminate_waiting_session', 'Terminer la session en attente'],
  ['plugin_dbadmin_terminate_waiting_session_confirm', 'Terminer la session {arg:sessionId} ? Ses modifications non validées seront annulées.'],
  ['plugin_dbadmin_no_sessions', 'Aucune session'],
  ['plugin_dbadmin_no_locks', 'Aucune attente de verrou'],
  ['plugin_dbadmin_no_lock_items', 'Aucun verrou'],
  ['plugin_dbadmin_query', 'Requête'],
  ['plugin_dbadmin_waiting_session_locks', 'Session en attente'],
  ['plugin_dbadmin_blocking_session_locks', 'Session bloquante'],
  ['plugin_dbadmin_not_connected', 'Connectez-vous à la base de données pour voir les sessions et les verrous.'],
];
