/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['plugin_data_import_title', 'Import danych'],
  ['plugin_data_import_file', 'Plik'],
  ['plugin_data_import_format_settings', 'Ustawienia formatu'],
  ['plugin_data_import_process_title', 'Importowanie danych...'],
  ['plugin_data_import_process_success', 'Dane zostały zaimportowane'],
  ['plugin_data_import_process_fail', 'Import danych nie powiódł się'],
  ['plugin_data_import_process_file_processing_step_message', 'Plik przesłany, przetwarzanie...'],
  ['plugin_data_import_settings_on_duplicate_key', 'Przy powtórzonym kluczu'],
  ['plugin_data_import_settings_use_bulk_load', 'Użyj ładowania zbiorczego'],
  ['plugin_data_import_settings_use_bulk_load_title', 'Użyj ładowania zbiorczego, aby przyspieszyć import'],
  ['plugin_data_import_settings_use_transactions', 'Użyj transakcji'],
  [
    'plugin_data_import_settings_use_transactions_title',
    'Wykonaj import w ramach transakcji bazy danych. Jeśli import się nie powiedzie, można wycofać wszystkie zmiany',
  ],
  [
    'plugin_data_import_settings_on_duplicate_key_title',
    'Wybierz sposób obsługi wierszy, które już istnieją w tabeli docelowej na podstawie klucza głównego lub unikatowego',
  ],
  ['plugin_data_import_settings_on_duplicate_key_placeholder', 'Brak'],
  ['plugin_data_import_settings_open_new_connection', 'Otwórz nowe połączenie'],
  [
    'plugin_data_import_settings_open_new_connection_title',
    'Użyj tej opcji, aby przyspieszyć przesyłanie danych. Po jej wybraniu zostanie otwarte nowe połączenie, a przesyłanie danych nie będzie kolidować z innymi wywołaniami do docelowej bazy danych.',
  ],
  ['plugin_data_import_settings_on_duplicate_key_help', 'Dowiedz się więcej o ustawieniu „Przy powtórzonym kluczu”'],
];
