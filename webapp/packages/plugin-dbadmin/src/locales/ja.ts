/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export default [
  ['plugin_dbadmin_session_manager', 'セッションマネージャー'],
  ['plugin_dbadmin_lock_manager', 'ロックマネージャー'],
  ['plugin_dbadmin_show_idle_sessions', 'アイドルセッションを表示'],
  ['plugin_dbadmin_cancel_query', 'クエリをキャンセル'],
  ['plugin_dbadmin_cancel_query_confirm', '選択した {arg:count} 個のセッションで実行中のクエリをキャンセルしますか？'],
  ['plugin_dbadmin_cancel_query_error', 'クエリをキャンセルできませんでした'],
  ['plugin_dbadmin_terminate_session', 'セッションを終了'],
  ['plugin_dbadmin_terminate_session_confirm', '選択した {arg:count} 個のセッションを終了しますか？コミットされていない変更はロールバックされます。'],
  ['plugin_dbadmin_terminate_session_error', 'セッションを終了できませんでした'],
  ['plugin_dbadmin_terminate_waiting_session', '待機中のセッションを終了'],
  ['plugin_dbadmin_terminate_waiting_session_confirm', 'セッション {arg:sessionId} を終了しますか？コミットされていない変更はロールバックされます。'],
  ['plugin_dbadmin_no_sessions', 'セッションはありません'],
  ['plugin_dbadmin_no_locks', 'ロック待機はありません'],
  ['plugin_dbadmin_no_lock_items', 'ロックはありません'],
  ['plugin_dbadmin_query', 'クエリ'],
  ['plugin_dbadmin_waiting_session_locks', '待機中のセッション'],
  ['plugin_dbadmin_blocking_session_locks', 'ブロックしているセッション'],
  ['plugin_dbadmin_not_connected', 'セッションとロックを表示するにはデータベースに接続してください。'],
];
