/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export default [
  ['plugin_dbadmin_session_manager', '세션 관리자'],
  ['plugin_dbadmin_lock_manager', '잠금 관리자'],
  ['plugin_dbadmin_show_idle_sessions', '유휴 세션 표시'],
  ['plugin_dbadmin_cancel_query', '쿼리 취소'],
  ['plugin_dbadmin_cancel_query_confirm', '선택한 세션 {arg:count}개에서 실행 중인 쿼리를 취소할까요?'],
  ['plugin_dbadmin_cancel_query_error', '쿼리를 취소하지 못했습니다'],
  ['plugin_dbadmin_terminate_session', '세션 종료'],
  ['plugin_dbadmin_terminate_session_confirm', '선택한 세션 {arg:count}개를 종료할까요? 커밋하지 않은 변경 사항은 롤백됩니다.'],
  ['plugin_dbadmin_terminate_session_error', '세션을 종료하지 못했습니다'],
  ['plugin_dbadmin_terminate_waiting_session', '대기 세션 종료'],
  ['plugin_dbadmin_terminate_waiting_session_confirm', '세션 {arg:sessionId}을(를) 종료할까요? 커밋하지 않은 변경 사항은 롤백됩니다.'],
  ['plugin_dbadmin_no_sessions', '세션 없음'],
  ['plugin_dbadmin_no_locks', '잠금 대기 없음'],
  ['plugin_dbadmin_no_lock_items', '잠금 없음'],
  ['plugin_dbadmin_query', '쿼리'],
  ['plugin_dbadmin_waiting_session_locks', '대기 중인 세션'],
  ['plugin_dbadmin_blocking_session_locks', '차단 중인 세션'],
  ['plugin_dbadmin_not_connected', '세션과 잠금을 보려면 데이터베이스에 연결하세요.'],
];
