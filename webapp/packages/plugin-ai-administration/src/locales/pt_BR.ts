/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['ai_administration_tab_title', 'Configurações de IA'],
  ['ai_administration_tab_main', 'Principal'],
  ['ai_administration_settings', 'Configurações de IA'],
  ['ai_administration_settings_save_success', 'Configurações de IA salvas'],
  ['ai_administration_settings_save_fail', 'Não foi possível salvar as configurações de IA'],
  ['ai_administration_settings_load_fail', 'Não foi possível carregar as configurações de IA'],
  ['ai_administration_language_model_settings_save_fail', 'Não foi possível salvar as configurações do mecanismo'],
  ['plugin_ai_administration_rag_label', 'Enviar apenas objetos relevantes à IA (experimental)'],
  [
    'plugin_ai_administration_rag_description',
    'O DBeaver analisa sua solicitação e envia apenas objetos relevantes à IA, melhorando o tempo de resposta e a precisão e reduzindo o uso de tokens (RAG). Atualmente compatível apenas com banco de dados Cloudbeaver PostgreSQL e mecanismos OpenAI/Copilot.',
  ],
  ['plugin_ai_administration_language_label', 'Idioma'],
  ['plugin_ai_administration_language_description', 'Idioma padrão das respostas da IA'],
  ['plugin_ai_administration_language_validation_error_title', 'Erro de validação do idioma'],
  ['plugin_ai_administration_language_validation_error', 'O idioma deve conter apenas letras e hífens'],
  ['plugin_ai_administration_language_length_validation_error', 'O idioma não pode ter mais de 128 caracteres'],
  ['plugin_ai_administration_default_profile_label', 'Perfil padrão'],
  ['plugin_ai_administration_default_profile_description', 'Perfil usado por padrão para recursos de IA'],
  ['plugin_ai_administration_default_profile_no_profiles_title', 'Nenhum perfil disponível'],
  ['plugin_ai_administration_default_profile_no_profiles_message', 'Crie um perfil antes de selecionar um perfil padrão'],
];
