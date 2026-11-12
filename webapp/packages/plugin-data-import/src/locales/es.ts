/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['plugin_data_import_title', 'Importación de datos'],
  ['plugin_data_import_file', 'Archivo'],
  ['plugin_data_import_format_settings', 'Configuración del formato'],
  ['plugin_data_import_process_title', 'Importando datos...'],
  ['plugin_data_import_process_success', 'Datos importados correctamente'],
  ['plugin_data_import_process_fail', 'La importación de datos ha fallado'],
  ['plugin_data_import_process_file_processing_step_message', 'Archivo subido, procesando...'],
  ['plugin_data_import_settings_on_duplicate_key', 'En caso de clave duplicada'],
  ['plugin_data_import_settings_use_bulk_load', 'Usar carga masiva'],
  ['plugin_data_import_settings_use_bulk_load_title', 'Usar carga masiva para importar más rápido'],
  ['plugin_data_import_settings_use_transactions', 'Usar transacciones'],
  [
    'plugin_data_import_settings_use_transactions_title',
    'Ejecutar la importación dentro de una transacción de base de datos. Si falla, se pueden revertir todos los cambios',
  ],
  [
    'plugin_data_import_settings_on_duplicate_key_title',
    'Elija cómo tratar las filas que ya existen en la tabla de destino según una clave primaria o única',
  ],
  ['plugin_data_import_settings_on_duplicate_key_placeholder', 'Ninguno'],
  ['plugin_data_import_settings_open_new_connection', 'Abrir nueva conexión'],
  [
    'plugin_data_import_settings_open_new_connection_title',
    'Use esta opción para acelerar la transferencia de datos. Si se selecciona, se abrirá una nueva conexión y la transferencia no interferirá con otras llamadas a la base de datos de destino.',
  ],
  ['plugin_data_import_settings_on_duplicate_key_help', 'Más información sobre el ajuste "En caso de clave duplicada"'],
];
