/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['plugin_data_import_title', 'Datenimport'],
  ['plugin_data_import_file', 'Datei'],
  ['plugin_data_import_format_settings', 'Formateinstellungen'],
  ['plugin_data_import_process_title', 'Daten werden importiert...'],
  ['plugin_data_import_process_success', 'Daten erfolgreich importiert'],
  ['plugin_data_import_process_fail', 'Datenimport fehlgeschlagen'],
  ['plugin_data_import_process_file_processing_step_message', 'Datei hochgeladen, Verarbeitung läuft...'],
  ['plugin_data_import_settings_on_duplicate_key', 'Bei doppeltem Schlüssel'],
  ['plugin_data_import_settings_use_bulk_load', 'Massenladen verwenden'],
  ['plugin_data_import_settings_use_bulk_load_title', 'Massenladen für schnelleren Import verwenden'],
  ['plugin_data_import_settings_use_transactions', 'Transaktionen verwenden'],
  [
    'plugin_data_import_settings_use_transactions_title',
    'Import innerhalb einer Datenbanktransaktion ausführen. Falls der Import fehlschlägt, können alle Änderungen zurückgerollt werden',
  ],
  [
    'plugin_data_import_settings_on_duplicate_key_title',
    'Legen Sie fest, wie Zeilen behandelt werden, die anhand eines Primär- oder eindeutigen Schlüssels bereits in der Zieltabelle vorhanden sind',
  ],
  ['plugin_data_import_settings_on_duplicate_key_placeholder', 'Keine'],
  ['plugin_data_import_settings_open_new_connection', 'Neue Verbindung öffnen'],
  [
    'plugin_data_import_settings_open_new_connection_title',
    'Verwenden Sie diese Option, um die Datenübertragung zu beschleunigen. Wenn sie ausgewählt ist, wird eine neue Verbindung geöffnet und die Datenübertragung beeinträchtigt keine anderen Aufrufe an die Zieldatenbank.',
  ],
  ['plugin_data_import_settings_on_duplicate_key_help', 'Mehr über die Einstellung "Bei doppeltem Schlüssel" erfahren'],
];
