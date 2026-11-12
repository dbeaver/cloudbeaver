/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['ai_administration_tab_title', 'AI 設定'],
  ['ai_administration_tab_main', '主要'],
  ['ai_administration_settings', 'AI 設定'],
  ['ai_administration_settings_save_success', 'AI 設定已儲存'],
  ['ai_administration_settings_save_fail', '無法儲存 AI 設定'],
  ['ai_administration_settings_load_fail', '無法載入 AI 設定'],
  ['ai_administration_language_model_settings_save_fail', '無法儲存引擎設定'],
  ['plugin_ai_administration_rag_label', '僅將相關物件傳送至 AI（實驗性功能）'],
  [
    'plugin_ai_administration_rag_description',
    'DBeaver 會分析您的請求，僅將相關物件傳送至 AI，改善回應速度與準確度，同時減少權杖用量（RAG）。目前僅支援搭配 PostgreSQL Cloudbeaver DB 及 OpenAI/Copilot 引擎使用。',
  ],
  ['plugin_ai_administration_language_label', '語言'],
  ['plugin_ai_administration_language_description', 'AI 回應的預設語言'],
  ['plugin_ai_administration_language_validation_error_title', '語言驗證錯誤'],
  ['plugin_ai_administration_language_validation_error', '語言只能包含英文字母及連字號'],
  ['plugin_ai_administration_language_length_validation_error', '語言長度不可超過 128 個字元'],
  ['plugin_ai_administration_default_profile_label', '預設設定檔'],
  ['plugin_ai_administration_default_profile_description', 'AI 功能預設使用的設定檔'],
  ['plugin_ai_administration_default_profile_no_profiles_title', '沒有可用的設定檔'],
  ['plugin_ai_administration_default_profile_no_profiles_message', '請先建立設定檔，再選取預設設定檔'],
];
