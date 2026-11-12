/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['ai_administration_tab_title', 'Configuración de IA'],
  ['ai_administration_tab_main', 'Principal'],
  ['ai_administration_settings', 'Configuración de IA'],
  ['ai_administration_settings_save_success', 'Configuración de IA guardada'],
  ['ai_administration_settings_save_fail', 'No se pudo guardar la configuración de IA'],
  ['ai_administration_settings_load_fail', 'No se pudo cargar la configuración de IA'],
  ['ai_administration_language_model_settings_save_fail', 'No se pudo guardar la configuración del motor'],
  ['plugin_ai_administration_rag_label', 'Enviar solo objetos relevantes a la IA (experimental)'],
  [
    'plugin_ai_administration_rag_description',
    'DBeaver analiza su solicitud y envía solo los objetos relevantes a la IA, mejorando el tiempo de respuesta y la precisión y reduciendo el uso de tokens (RAG). Actualmente solo se admite con una base de datos Cloudbeaver PostgreSQL y motores OpenAI/Copilot.',
  ],
  ['plugin_ai_administration_language_label', 'Idioma'],
  ['plugin_ai_administration_language_description', 'Idioma predeterminado de las respuestas de IA'],
  ['plugin_ai_administration_language_validation_error_title', 'Error de validación del idioma'],
  ['plugin_ai_administration_language_validation_error', 'El idioma solo puede contener letras y guiones'],
  ['plugin_ai_administration_language_length_validation_error', 'El idioma no puede superar los 128 caracteres'],
  ['plugin_ai_administration_default_profile_label', 'Perfil predeterminado'],
  ['plugin_ai_administration_default_profile_description', 'Perfil usado de forma predeterminada para funciones de IA'],
  ['plugin_ai_administration_default_profile_no_profiles_title', 'No hay perfiles disponibles'],
  ['plugin_ai_administration_default_profile_no_profiles_message', 'Cree un perfil antes de seleccionar un perfil predeterminado'],
];
