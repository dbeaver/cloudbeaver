/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['plugin_data_import_title', 'Importação de dados'],
  ['plugin_data_import_file', 'Arquivo'],
  ['plugin_data_import_format_settings', 'Configurações de formato'],
  ['plugin_data_import_process_title', 'Importando dados...'],
  ['plugin_data_import_process_success', 'Dados importados com sucesso'],
  ['plugin_data_import_process_fail', 'Falha na importação de dados'],
  ['plugin_data_import_process_file_processing_step_message', 'Arquivo enviado, processando...'],
  ['plugin_data_import_settings_on_duplicate_key', 'Em caso de chave duplicada'],
  ['plugin_data_import_settings_use_bulk_load', 'Usar carga em massa'],
  ['plugin_data_import_settings_use_bulk_load_title', 'Usar carga em massa para importar mais rapidamente'],
  ['plugin_data_import_settings_use_transactions', 'Usar transações'],
  [
    'plugin_data_import_settings_use_transactions_title',
    'Executar a importação em uma transação de banco de dados. Se a importação falhar, todas as alterações poderão ser revertidas',
  ],
  [
    'plugin_data_import_settings_on_duplicate_key_title',
    'Escolha como tratar as linhas que já existem na tabela de destino com base em uma chave primária ou única',
  ],
  ['plugin_data_import_settings_on_duplicate_key_placeholder', 'Nenhum'],
  ['plugin_data_import_settings_open_new_connection', 'Abrir nova conexão'],
  [
    'plugin_data_import_settings_open_new_connection_title',
    'Use esta opção para acelerar a transferência de dados. Se selecionada, uma nova conexão será aberta e a transferência não interferirá em outras chamadas ao banco de dados de destino.',
  ],
  ['plugin_data_import_settings_on_duplicate_key_help', 'Saiba mais sobre a configuração "Em caso de chave duplicada"'],
];
