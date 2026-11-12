/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['ai_administration_tab_title', 'Ustawienia AI'],
  ['ai_administration_tab_main', 'Główne'],
  ['ai_administration_settings', 'Ustawienia AI'],
  ['ai_administration_settings_save_success', 'Ustawienia AI zostały zapisane'],
  ['ai_administration_settings_save_fail', 'Nie udało się zapisać ustawień AI'],
  ['ai_administration_settings_load_fail', 'Nie udało się wczytać ustawień AI'],
  ['ai_administration_language_model_settings_save_fail', 'Nie udało się zapisać ustawień silnika'],
  ['plugin_ai_administration_rag_label', 'Wysyłaj do AI tylko istotne obiekty (eksperymentalne)'],
  [
    'plugin_ai_administration_rag_description',
    'DBeaver analizuje zapytanie i wysyła do AI tylko istotne obiekty, poprawiając czas i dokładność odpowiedzi oraz zmniejszając zużycie tokenów (RAG). Obecnie obsługiwane tylko przy użyciu bazy danych Cloudbeaver PostgreSQL i silników OpenAI/Copilot.',
  ],
  ['plugin_ai_administration_language_label', 'Język'],
  ['plugin_ai_administration_language_description', 'Domyślny język odpowiedzi AI'],
  ['plugin_ai_administration_language_validation_error_title', 'Błąd walidacji języka'],
  ['plugin_ai_administration_language_validation_error', 'Język może zawierać tylko litery i łączniki'],
  ['plugin_ai_administration_language_length_validation_error', 'Język nie może mieć więcej niż 128 znaków'],
  ['plugin_ai_administration_default_profile_label', 'Profil domyślny'],
  ['plugin_ai_administration_default_profile_description', 'Profil używany domyślnie przez funkcje AI'],
  ['plugin_ai_administration_default_profile_no_profiles_title', 'Brak dostępnych profili'],
  ['plugin_ai_administration_default_profile_no_profiles_message', 'Utwórz profil przed wybraniem profilu domyślnego'],
];
