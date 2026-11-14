/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export default [
  ['plugin_dbadmin_session_manager', 'Менеджер сессий'],
  ['plugin_dbadmin_lock_manager', 'Менеджер блокировок'],
  ['plugin_dbadmin_show_idle_sessions', 'Показывать простаивающие сессии'],
  ['plugin_dbadmin_cancel_query', 'Отменить запрос'],
  ['plugin_dbadmin_cancel_query_confirm', 'Отменить выполняемый запрос в выбранных сессиях ({arg:count})?'],
  ['plugin_dbadmin_cancel_query_error', 'Не удалось отменить запрос'],
  ['plugin_dbadmin_terminate_session', 'Завершить сессию'],
  ['plugin_dbadmin_terminate_session_confirm', 'Завершить выбранные сессии ({arg:count})? Незафиксированные изменения в них будут откачены.'],
  ['plugin_dbadmin_terminate_session_error', 'Не удалось завершить сессию'],
  ['plugin_dbadmin_terminate_waiting_session', 'Завершить ожидающую сессию'],
  ['plugin_dbadmin_terminate_waiting_session_confirm', 'Завершить сессию {arg:sessionId}? Её незафиксированные изменения будут откачены.'],
  ['plugin_dbadmin_no_sessions', 'Нет сессий'],
  ['plugin_dbadmin_no_locks', 'Нет ожиданий блокировок'],
  ['plugin_dbadmin_no_lock_items', 'Нет блокировок'],
  ['plugin_dbadmin_query', 'Запрос'],
  ['plugin_dbadmin_waiting_session_locks', 'Ожидающая сессия'],
  ['plugin_dbadmin_blocking_session_locks', 'Блокирующая сессия'],
  ['plugin_dbadmin_not_connected', 'Подключитесь к базе данных, чтобы увидеть сессии и блокировки.'],
];
