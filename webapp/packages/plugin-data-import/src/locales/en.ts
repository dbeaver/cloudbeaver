export default [
  ['plugin_data_import_title', 'Data import'],
  ['plugin_data_import_process_title', 'Importing data...'],
  ['plugin_data_import_process_success', 'Data imported successfully'],
  ['plugin_data_import_process_fail', 'Data import failed'],
  ['plugin_data_import_process_file_processing_step_message', 'File uploaded, processing...'],
  ['plugin_data_import_settings_on_duplicate_key', 'On duplicate key'],
  ['plugin_data_import_settings_use_bulk_load', 'Use bulk load'],
  ['plugin_data_import_settings_use_bulk_load_title', 'Use bulk load for faster import'],
  ['plugin_data_import_settings_use_transactions', 'Use transactions'],
  [
    'plugin_data_import_settings_use_transactions_title',
    'Execute the import within a database transaction. If the import fails, all changes can be rolled back',
  ],

  [
    'plugin_data_import_settings_on_duplicate_key_title',
    'Choose how to handle rows that already exist in the target table based on a primary or unique key',
  ],
  ['plugin_data_import_settings_on_duplicate_key_placeholder', 'None'],
  ['plugin_data_import_settings_open_new_connection', 'Open new connection'],
  [
    'plugin_data_import_settings_open_new_connection_title',
    'Use this option to speed up data transfer. If selected, a new connection will be opened and the data transfer will not interfere with other calls to the database where data is being transferred to.',
  ],
  ['plugin_data_import_settings_on_duplicate_key_help', 'Learn more about the "On duplicate key" setting'],
];
