/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['ai_administration_tab_title', 'AI 设置'],
  ['ai_administration_tab_main', '主要'],
  ['ai_administration_settings', 'AI 设置'],
  ['ai_administration_settings_save_success', 'AI 设置已保存'],
  ['ai_administration_settings_save_fail', 'AI 设置保存失败'],
  ['ai_administration_settings_load_fail', 'AI 设置加载失败'],
  ['ai_administration_language_model_settings_save_fail', '引擎设置保存失败'],
  ['plugin_ai_administration_rag_label', '仅向 AI 发送相关对象（实验性）'],
  [
    'plugin_ai_administration_rag_description',
    'DBeaver 会分析您的请求，仅向 AI 发送相关对象，从而缩短响应时间、提高准确性并减少令牌用量（RAG）。目前仅在使用 PostgreSQL Cloudbeaver 数据库和 OpenAI/Copilot 引擎时支持。',
  ],
  ['plugin_ai_administration_language_label', '语言'],
  ['plugin_ai_administration_language_description', 'AI 回复的默认语言'],
  ['plugin_ai_administration_language_validation_error_title', '语言验证错误'],
  ['plugin_ai_administration_language_validation_error', '语言只能包含字母和连字符'],
  ['plugin_ai_administration_language_length_validation_error', '语言不得超过 128 个字符'],
  ['plugin_ai_administration_default_profile_label', '默认配置'],
  ['plugin_ai_administration_default_profile_description', 'AI 功能默认使用的配置'],
  ['plugin_ai_administration_default_profile_no_profiles_title', '没有可用配置'],
  ['plugin_ai_administration_default_profile_no_profiles_message', '请先创建配置，再选择默认配置'],
];
