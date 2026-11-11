/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['plugin_data_import_title', 'データのインポート'],
  ['plugin_data_import_file', 'ファイル'],
  ['plugin_data_import_format_settings', '形式の設定'],
  ['plugin_data_import_process_title', 'データをインポート中...'],
  ['plugin_data_import_process_success', 'データをインポートしました'],
  ['plugin_data_import_process_fail', 'データのインポートに失敗しました'],
  ['plugin_data_import_process_file_processing_step_message', 'ファイルをアップロードしました。処理中...'],
  ['plugin_data_import_settings_on_duplicate_key', 'キー重複時の処理'],
  ['plugin_data_import_settings_use_bulk_load', '一括読み込みを使用'],
  ['plugin_data_import_settings_use_bulk_load_title', '一括読み込みを使用してインポートを高速化'],
  ['plugin_data_import_settings_use_transactions', 'トランザクションを使用'],
  [
    'plugin_data_import_settings_use_transactions_title',
    'データベーストランザクション内でインポートを実行します。失敗した場合は、すべての変更をロールバックできます',
  ],
  ['plugin_data_import_settings_on_duplicate_key_title', '主キーまたは一意キーに基づき、対象テーブルにすでに存在する行の処理方法を選択'],
  ['plugin_data_import_settings_on_duplicate_key_placeholder', 'なし'],
  ['plugin_data_import_settings_open_new_connection', '新しい接続を開く'],
  [
    'plugin_data_import_settings_open_new_connection_title',
    'このオプションを使用するとデータ転送を高速化できます。選択すると新しい接続が開かれ、転送先データベースへの他の呼び出しに影響せずにデータ転送を行います。',
  ],
  ['plugin_data_import_settings_on_duplicate_key_help', '「キー重複時の処理」設定の詳細'],
];
