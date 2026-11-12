/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['ai_administration_tab_title', 'AI 設定'],
  ['ai_administration_tab_main', '基本'],
  ['ai_administration_settings', 'AI 設定'],
  ['ai_administration_settings_save_success', 'AI 設定を保存しました'],
  ['ai_administration_settings_save_fail', 'AI 設定の保存に失敗しました'],
  ['ai_administration_settings_load_fail', 'AI 設定の読み込みに失敗しました'],
  ['ai_administration_language_model_settings_save_fail', 'エンジン設定の保存に失敗しました'],
  ['plugin_ai_administration_rag_label', '関連するオブジェクトのみを AI に送信（試験的機能）'],
  [
    'plugin_ai_administration_rag_description',
    'DBeaver はリクエストを分析して関連するオブジェクトのみを AI に送信し、トークン使用量を削減しながら応答時間と精度を改善します（RAG）。現在は PostgreSQL Cloudbeaver DB と OpenAI/Copilot エンジンを使用する場合のみサポートされます。',
  ],
  ['plugin_ai_administration_language_label', '言語'],
  ['plugin_ai_administration_language_description', 'AI 応答の既定の言語'],
  ['plugin_ai_administration_language_validation_error_title', '言語の検証エラー'],
  ['plugin_ai_administration_language_validation_error', '言語には英字とハイフンのみを使用できます'],
  ['plugin_ai_administration_language_length_validation_error', '言語は 128 文字以内にしてください'],
  ['plugin_ai_administration_default_profile_label', '既定のプロファイル'],
  ['plugin_ai_administration_default_profile_description', 'AI 機能で既定で使用するプロファイル'],
  ['plugin_ai_administration_default_profile_no_profiles_title', '利用可能なプロファイルがありません'],
  ['plugin_ai_administration_default_profile_no_profiles_message', '既定のプロファイルを選択する前に、プロファイルを作成してください'],
];
