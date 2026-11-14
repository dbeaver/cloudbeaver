/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export default [
  ['plugin_dbadmin_session_manager', '会话管理器'],
  ['plugin_dbadmin_lock_manager', '锁管理器'],
  ['plugin_dbadmin_show_idle_sessions', '显示空闲会话'],
  ['plugin_dbadmin_cancel_query', '取消查询'],
  ['plugin_dbadmin_cancel_query_confirm', '取消所选 {arg:count} 个会话中正在运行的查询？'],
  ['plugin_dbadmin_cancel_query_error', '无法取消查询'],
  ['plugin_dbadmin_terminate_session', '终止会话'],
  ['plugin_dbadmin_terminate_session_confirm', '终止所选 {arg:count} 个会话？未提交的更改将被回滚。'],
  ['plugin_dbadmin_terminate_session_error', '无法终止会话'],
  ['plugin_dbadmin_terminate_waiting_session', '终止等待会话'],
  ['plugin_dbadmin_terminate_waiting_session_confirm', '终止会话 {arg:sessionId}？其未提交的更改将被回滚。'],
  ['plugin_dbadmin_no_sessions', '没有会话'],
  ['plugin_dbadmin_no_locks', '没有锁等待'],
  ['plugin_dbadmin_no_lock_items', '没有锁'],
  ['plugin_dbadmin_query', '查询'],
  ['plugin_dbadmin_waiting_session_locks', '等待会话'],
  ['plugin_dbadmin_blocking_session_locks', '阻塞会话'],
  ['plugin_dbadmin_not_connected', '连接到数据库以查看会话和锁。'],
];
