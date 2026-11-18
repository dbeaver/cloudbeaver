/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export default [
  ['plugin_dbadmin_session_manager', '工作階段管理員'],
  ['plugin_dbadmin_lock_manager', '鎖定管理員'],
  ['plugin_dbadmin_show_idle_sessions', '顯示閒置工作階段'],
  ['plugin_dbadmin_cancel_query', '取消查詢'],
  ['plugin_dbadmin_cancel_query_confirm', '取消所選 {arg:count} 個工作階段中正在執行的查詢？'],
  ['plugin_dbadmin_cancel_query_error', '無法取消查詢'],
  ['plugin_dbadmin_terminate_session', '終止工作階段'],
  ['plugin_dbadmin_terminate_session_confirm', '終止所選 {arg:count} 個工作階段？未提交的變更將被復原。'],
  ['plugin_dbadmin_terminate_session_error', '無法終止工作階段'],
  ['plugin_dbadmin_terminate_waiting_session', '終止等待中的工作階段'],
  ['plugin_dbadmin_terminate_waiting_session_confirm', '終止工作階段 {arg:sessionId}？其未提交的變更將被復原。'],
  ['plugin_dbadmin_no_sessions', '沒有工作階段'],
  ['plugin_dbadmin_no_locks', '沒有鎖定等待'],
  ['plugin_dbadmin_no_lock_items', '沒有鎖定'],
  ['plugin_dbadmin_query', '查詢'],
  ['plugin_dbadmin_waiting_session_locks', '等待中的工作階段'],
  ['plugin_dbadmin_blocking_session_locks', '封鎖中的工作階段'],
  ['plugin_dbadmin_not_connected', '連線到資料庫以檢視工作階段和鎖定。'],
];
