/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['plugin_data_import_title', 'Import de date'],
  ['plugin_data_import_file', 'Fișier'],
  ['plugin_data_import_format_settings', 'Setări de format'],
  ['plugin_data_import_process_title', 'Se importă datele...'],
  ['plugin_data_import_process_success', 'Datele au fost importate cu succes'],
  ['plugin_data_import_process_fail', 'Importul datelor a eșuat'],
  ['plugin_data_import_process_file_processing_step_message', 'Fișier încărcat, se procesează...'],
  ['plugin_data_import_settings_on_duplicate_key', 'La cheie duplicată'],
  ['plugin_data_import_settings_use_bulk_load', 'Folosește încărcarea în bloc'],
  ['plugin_data_import_settings_use_bulk_load_title', 'Folosește încărcarea în bloc pentru un import mai rapid'],
  ['plugin_data_import_settings_use_transactions', 'Folosește tranzacții'],
  [
    'plugin_data_import_settings_use_transactions_title',
    'Execută importul în cadrul unei tranzacții a bazei de date. Dacă importul eșuează, toate modificările pot fi revocate',
  ],
  [
    'plugin_data_import_settings_on_duplicate_key_title',
    'Alege cum să fie tratate rândurile care există deja în tabelul destinație pe baza unei chei primare sau unice',
  ],
  ['plugin_data_import_settings_on_duplicate_key_placeholder', 'Niciuna'],
  ['plugin_data_import_settings_open_new_connection', 'Deschide o conexiune nouă'],
  [
    'plugin_data_import_settings_open_new_connection_title',
    'Folosește această opțiune pentru a accelera transferul datelor. Dacă este selectată, se va deschide o conexiune nouă, iar transferul datelor nu va interfera cu alte apeluri către baza de date destinație.',
  ],
  ['plugin_data_import_settings_on_duplicate_key_help', 'Află mai multe despre setarea „La cheie duplicată”'],
];
