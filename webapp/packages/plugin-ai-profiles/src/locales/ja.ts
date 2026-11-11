/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['plugin_ai_profiles_profile_menu', 'プロファイルの操作'],
  ['plugin_ai_profiles_profile_clone', '複製'],
  ['plugin_ai_profiles_default_badge', '（既定）'],
  [
    'plugin_ai_profiles_default_description',
    'AI リクエストの既定のプロファイルです。変更するには、チャットでプロファイルを選択するか、「既定に設定」を使用してください。',
  ],
  ['plugin_ai_profiles_set_default', '既定に設定'],
  ['plugin_ai_profiles_default_save_failed', '既定の AI プロファイルの保存に失敗しました'],
  ['plugin_ai_profiles_scope', '範囲'],
  ['plugin_ai_profiles_scope_global', 'グローバル'],
  ['plugin_ai_profiles_scope_user', 'ユーザー'],
  ['plugin_ai_credentials_dialog_title', 'AI プロファイルの認証情報'],
  ['plugin_ai_credentials_dialog_description', 'この AI プロファイルで使用する、あなたのユーザーアカウントの認証情報を入力してください。'],
  ['plugin_ai_credentials_profile', 'プロファイル'],
  ['plugin_ai_credentials_engine', 'エンジン'],
  ['plugin_ai_credentials_token', 'API トークン'],
  ['plugin_ai_credentials_token_required', 'API トークンを入力してください。'],
  ['plugin_ai_credentials_method', '認証方式'],
  ['plugin_ai_credentials_subscription', 'サブスクリプション'],
  ['plugin_ai_credentials_account', '{arg:provider} アカウント'],
  ['plugin_ai_account_connect', 'アカウントを接続'],
  ['plugin_ai_account_connected', 'アカウント接続済み'],
  ['plugin_ai_account_disconnected', 'アカウント接続解除済み'],
  ['plugin_ai_account_not_connected', 'アカウント未接続'],
  ['plugin_ai_account_disconnect', 'アカウントの接続を解除'],
  [
    'plugin_ai_account_disconnect_confirmation',
    'この AI プロファイルからアカウントの接続を解除しますか？保存済みの API トークンは保持されますが、認証方式は変更されません。',
  ],
  ['plugin_ai_account_disconnect_failed', 'アカウントの接続解除に失敗しました'],
  ['plugin_ai_device_code', 'デバイスコード'],
  ['plugin_ai_device_open_provider', '{arg:provider} の認可ページを開く'],
  [
    'plugin_ai_device_instructions',
    'プロバイダーのページでこのコードを入力し、アクセスを承認してください。接続中はこのウィンドウを開いたままにしてください。閉じると試行がキャンセルされます。',
  ],
  ['plugin_ai_device_waiting', 'アカウントの認可を待機中…'],
  ['plugin_ai_device_expiration', 'このコードの有効期間は最大 {arg:minutes} 分です。'],
  ['plugin_ai_device_retry', '再試行'],
  ['plugin_ai_device_failed', 'アカウントの接続に失敗しました'],
  ['plugin_ai_device_cancel_failed', 'アカウント認可のキャンセルに失敗しました'],
  ['plugin_ai_device_cancel_title', 'アカウントの認可をキャンセルしますか？'],
  ['plugin_ai_device_cancel_confirmation', 'アカウントの認可が進行中です。キャンセルしますか？'],
  ['plugin_ai_device_cancel', 'キャンセル'],
  ['plugin_ai_device_continue', '続行'],
  ['plugin_ai_credentials_reset', '認証情報をリセット'],
  ['plugin_ai_credentials_reset_title', 'AI プロファイルの認証情報をリセット'],
  ['plugin_ai_credentials_reset_confirmation', '保存済みの API トークンを削除しますか？接続済みのサブスクリプションアカウントは保持されます。'],
  ['plugin_ai_credentials_profile_not_found', 'AI プロファイルが見つかりません'],
  ['plugin_ai_credentials_saved', 'AI プロファイルの認証情報を保存しました'],
  ['plugin_ai_credentials_reset_success', 'AI プロファイルの認証情報をリセットしました'],
  ['plugin_ai_credentials_save_failed', 'AI プロファイルの認証情報の保存に失敗しました'],
  ['plugin_ai_credentials_reset_failed', 'AI プロファイルの認証情報のリセットに失敗しました'],
];
