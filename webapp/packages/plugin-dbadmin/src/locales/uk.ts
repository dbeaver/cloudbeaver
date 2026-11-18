/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export default [
  ['plugin_dbadmin_session_manager', 'Менеджер сесій'],
  ['plugin_dbadmin_lock_manager', 'Менеджер блокувань'],
  ['plugin_dbadmin_show_idle_sessions', 'Показувати неактивні сесії'],
  ['plugin_dbadmin_cancel_query', 'Скасувати запит'],
  ['plugin_dbadmin_cancel_query_confirm', 'Скасувати виконуваний запит у вибраних сесіях ({arg:count})?'],
  ['plugin_dbadmin_cancel_query_error', 'Не вдалося скасувати запит'],
  ['plugin_dbadmin_terminate_session', 'Завершити сесію'],
  ['plugin_dbadmin_terminate_session_confirm', 'Завершити вибрані сесії ({arg:count})? Незафіксовані зміни буде відкочено.'],
  ['plugin_dbadmin_terminate_session_error', 'Не вдалося завершити сесію'],
  ['plugin_dbadmin_terminate_waiting_session', 'Завершити сесію, що очікує'],
  ['plugin_dbadmin_terminate_waiting_session_confirm', 'Завершити сесію {arg:sessionId}? Її незафіксовані зміни буде відкочено.'],
  ['plugin_dbadmin_no_sessions', 'Немає сесій'],
  ['plugin_dbadmin_no_locks', 'Немає очікувань блокувань'],
  ['plugin_dbadmin_no_lock_items', 'Немає блокувань'],
  ['plugin_dbadmin_query', 'Запит'],
  ['plugin_dbadmin_waiting_session_locks', 'Сесія, що очікує'],
  ['plugin_dbadmin_blocking_session_locks', 'Сесія, що блокує'],
  ['plugin_dbadmin_not_connected', 'Підключіться до бази даних, щоб побачити сесії та блокування.'],
];
