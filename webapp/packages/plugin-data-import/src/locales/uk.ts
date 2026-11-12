/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['plugin_data_import_title', 'Імпорт даних'],
  ['plugin_data_import_file', 'Файл'],
  ['plugin_data_import_format_settings', 'Налаштування формату'],
  ['plugin_data_import_process_title', 'Імпортування даних...'],
  ['plugin_data_import_process_success', 'Дані успішно імпортовано'],
  ['plugin_data_import_process_fail', 'Не вдалося імпортувати дані'],
  ['plugin_data_import_process_file_processing_step_message', 'Файл вивантажено, обробка...'],
  ['plugin_data_import_settings_on_duplicate_key', 'У разі дублювання ключа'],
  ['plugin_data_import_settings_use_bulk_load', 'Використовувати масове завантаження'],
  ['plugin_data_import_settings_use_bulk_load_title', 'Використовувати масове завантаження для пришвидшення імпорту'],
  ['plugin_data_import_settings_use_transactions', 'Використовувати транзакції'],
  [
    'plugin_data_import_settings_use_transactions_title',
    'Виконати імпорт у межах транзакції бази даних. Якщо імпорт завершиться помилкою, усі зміни можна буде відкотити',
  ],
  [
    'plugin_data_import_settings_on_duplicate_key_title',
    'Виберіть спосіб обробки рядків, які вже існують у цільовій таблиці за первинним або унікальним ключем',
  ],
  ['plugin_data_import_settings_on_duplicate_key_placeholder', 'Немає'],
  ['plugin_data_import_settings_open_new_connection', 'Відкрити нове підключення'],
  [
    'plugin_data_import_settings_open_new_connection_title',
    'Скористайтеся цією опцією, щоб пришвидшити передавання даних. Якщо її вибрано, буде відкрито нове підключення, і передавання даних не заважатиме іншим зверненням до бази даних, у яку вони передаються.',
  ],
  ['plugin_data_import_settings_on_duplicate_key_help', 'Докладніше про налаштування «У разі дублювання ключа»'],
];
