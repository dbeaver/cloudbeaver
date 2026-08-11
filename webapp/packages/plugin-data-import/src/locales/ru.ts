export default [
  ['plugin_data_import_title', 'Импорт данных'],
  ['plugin_data_import_process_title', 'Импорт данных...'],
  ['plugin_data_import_process_success', 'Данные успешно импортированы'],
  ['plugin_data_import_process_fail', 'Ошибка импорта данных'],
  ['plugin_data_import_process_file_processing_step_message', 'Файл загружен, обработка...'],
  ['plugin_data_import_settings_on_duplicate_key', 'При дублировании ключа'],
  [
    'plugin_data_import_settings_on_duplicate_key_title',
    'Выберите, как обрабатывать строки, которые уже существуют в целевой таблице на основе первичного или уникального ключа',
  ],

  ['plugin_data_import_settings_use_bulk_load', 'Использовать массовую загрузку'],
  ['plugin_data_import_settings_use_bulk_load_title', 'Использовать массовую загрузку для более быстрого импорта'],
  ['plugin_data_import_settings_use_transactions', 'Использовать транзакции'],
  [
    'plugin_data_import_settings_use_transactions_title',
    'Выполнять импорт в рамках транзакции базы данных. Если импорт не удается, все изменения могут быть отменены',
  ],
  ['plugin_data_import_settings_on_duplicate_key_placeholder', 'Нет'],
  ['plugin_data_import_settings_open_new_connection', 'Открыть новое соединение'],
  [
    'plugin_data_import_settings_open_new_connection_title',
    'Используйте эту опцию, чтобы ускорить передачу данных. Если выбран этот параметр, будет открыто новое соединение, и передача данных не будет мешать другим вызовам к базе данных, в которую передаются данные',
  ],
  ['plugin_data_import_settings_on_duplicate_key_help', 'Узнать больше о параметре "При дублировании ключа"'],
];
