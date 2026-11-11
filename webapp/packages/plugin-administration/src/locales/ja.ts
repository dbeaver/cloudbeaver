/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['administration_server_configuration_settings_connections', '接続'],
  ['administration_server_configuration_settings_ai', 'AI'],
  ['administration_server_configuration_settings_cloud', 'クラウド'],
  ['administration_server_configuration_settings_workspace', 'ワークスペース'],
  ['administration_server_configuration_tab_drivers', 'ドライバー'],
  ['administration_server_configuration_save_confirmation_title', 'サーバー設定の更新'],
  ['administration_server_configuration_save_confirmation_message', '重要な設定を変更しようとしています。よろしいですか？'],
  ['administration_configuration_wizard_welcome', 'ようこそ'],
  ['administration_configuration_wizard_welcome_step_description', '{alias:product_full_name} へようこそ'],
  ['administration_configuration_wizard_welcome_title', 'クラウドデータベース管理システム {alias:product_full_name} へようこそ'],
  [
    'administration_configuration_wizard_welcome_message',
    '簡単設定ウィザードで、いくつかの簡単な手順に従ってサーバーを設定できます。サーバー情報と管理者の認証情報を設定してください。簡単設定の完了後に、追加のサーバーパラメーターを設定できます。',
  ],
  ['administration_configuration_wizard_welcome_note', '注：これらの設定は、後で管理パネルから変更できます。'],
  ['administration_configuration_wizard_configuration', 'サーバー設定'],
  ['administration_configuration_wizard_configuration_step_description', 'サーバーの基本設定'],
  ['administration_configuration_wizard_configuration_description', 'サーバーの基本パラメーターを設定します。設定完了後にサービスを追加できます。'],
  ['administration_configuration_wizard_configuration_password_warning', '管理者パスワードを忘れないでください。自動的に復元することはできません。'],
  ['administration_configuration_wizard_configuration_save_error', 'サーバー設定の保存に失敗しました'],
  ['administration_configuration_tools_save_tooltip', '設定を保存'],
  ['administration_configuration_tools_cancel_tooltip', '変更をリセット'],
  ['administration_configuration_wizard_configuration_secure_cookies', 'HTTPS モードを強制'],
  [
    'administration_configuration_wizard_configuration_secure_cookies_description',
    'HTTPS を強制してサーバーとクライアント間の通信を保護します。本番環境での使用を推奨します。アプリが正常に動作するよう、HTTPS プロキシを適切に設定してください',
  ],
  [
    'administration_configuration_wizard_configuration_secure_cookies_warning',
    'HTTPS 強制モードを無効にすると、データは暗号化されず、危険にさらされます',
  ],
  ['administration_configuration_wizard_configuration_secure_cookies_docs', 'サーバープロキシの設定ドキュメント'],
  ['administration_configuration_wizard_configuration_supported_hosts', '許可するサーバー URL'],
  [
    'administration_configuration_wizard_configuration_supported_hosts_description',
    'サーバー URL は改行で区切って複数指定できます。空の場合はすべての URL を許可します。IP アドレスからのアクセスは常に許可されます。',
  ],
  [
    'administration_configuration_wizard_configuration_supported_hosts_warning',
    '現在のドメイン（{arg:host}）は削除できません。このドメインを削除するには、別の許可されたドメインまたは IP アドレスからサーバー設定を開いてください。',
  ],
  ['administration_configuration_wizard_configuration_server_info', 'サーバー情報'],
  ['administration_configuration_wizard_configuration_server_name', 'サーバー名'],
  ['administration_configuration_wizard_configuration_server_url', 'サーバー URL'],
  ['administration_configuration_wizard_configuration_server_url_description', 'グローバルアクセス用サーバー URL'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_title', '未保存の設定'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_message', '設定はサーバー設定ページで保存できます'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_navigate', '開く'],
  ['administration_configuration_wizard_configuration_server_session_lifetime', 'セッションの有効期間（分）'],
  [
    'administration_configuration_wizard_configuration_server_session_lifetime_description',
    'セッションがアイドル状態になってから期限切れになるまでの時間を分単位で指定します',
  ],
  ['administration_configuration_wizard_configuration_plugins', '機能'],
  ['administration_configuration_wizard_configuration_custom_connections', 'プライベート接続を有効にする'],
  ['administration_configuration_wizard_configuration_custom_connections_description', 'ユーザーがプライベート接続を作成できるようにする'],
  ['administration_configuration_wizard_configuration_navigation_tree_view', 'ナビゲーターの簡易表示'],
  [
    'administration_configuration_wizard_configuration_navigation_tree_view_description',
    '既定では、ユーザーの新しい接続にはナビゲーションツリーで基本情報のみが表示されます',
  ],
  ['administration_configuration_wizard_configuration_security', 'セキュリティ'],
  ['administration_configuration_wizard_configuration_security_admin_credentials', '認証情報を保存'],
  ['administration_configuration_wizard_configuration_security_admin_credentials_description', '事前設定されたデータベースの認証情報の保存を許可'],
  ['administration_configuration_wizard_configuration_security_public_credentials', 'ユーザーの認証情報を保存'],
  ['administration_configuration_wizard_configuration_security_public_credentials_description', '管理者以外のユーザーの認証情報の保存を許可'],
  ['administration_configuration_wizard_configuration_security_db_user_password_change', 'データベースユーザーのパスワード変更を許可'],
  [
    'administration_configuration_wizard_configuration_security_db_user_password_change_description',
    'データベース接続に関連付けられたユーザーのパスワード変更を許可',
  ],
  ['administration_configuration_wizard_configuration_navigator', 'ナビゲーター'],
  ['administration_configuration_wizard_configuration_navigator_hide_folders', 'フォルダーを非表示'],
  ['administration_configuration_wizard_configuration_navigator_hide_schemas', 'スキーマを非表示'],
  ['administration_configuration_wizard_configuration_navigator_hide_virtual_model', '仮想モデルを非表示'],
  ['administration_configuration_wizard_configuration_navigator_merge_entities', 'エンティティを統合'],
  ['administration_configuration_wizard_configuration_navigator_show_only_entities', 'エンティティのみ'],
  ['administration_configuration_wizard_configuration_navigator_show_system_objects', 'システムオブジェクト'],
  ['administration_configuration_wizard_configuration_navigator_show_utility_objects', 'ユーティリティオブジェクト'],
  ['administration_configuration_wizard_step_validation_message', '次の手順に進めませんでした'],
  ['administration_configuration_wizard_finish', '確認'],
  ['administration_configuration_wizard_finish_step_description', '確認'],
  ['administration_configuration_wizard_finish_title', '設定はほぼ完了です。'],
  [
    'administration_configuration_wizard_finish_message',
    '「完了」ボタンを押すとサーバー設定が完了します。変更や追加を行う場合は、前のページに戻ることができます。\n設定が完了すると、入力したすべての設定がサーバーに適用されます。メインページに移動して作業を開始できます。\n管理者としてログインすれば、いつでもサーバー設定を変更できます。',
  ],
  ['administration_disabled_drivers_title', '無効なドライバー'],
  ['administration_disabled_drivers_search_placeholder', 'ドライバーを検索...'],
  [
    'administration_disabled_drivers_enable_unsafe_driver_message',
    'このデータベースドライバーを有効にすると、このアプリケーションを実行しているサーバー上のファイルにアクセスできる場合があります。機密性の高いシステムファイルや保護されたデータが漏えいする可能性があります。\n\n影響を十分に理解し、データベースの構成を信頼できる場合のみ続行してください。このドライバーの不正または不適切な使用は、セキュリティリスクにつながる可能性があります。\n\n「{arg:driverName}」ドライバーを有効にしますか？',
  ],
];
