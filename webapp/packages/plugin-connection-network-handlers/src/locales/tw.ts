/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['plugin_connection_network_handlers_ssh_tunnel_title', 'SSH 通道'],
  ['plugin_connection_network_handlers_ssh_test', '測試通道'],
  ['plugin_connection_network_handlers_connection_ssl_enable', '啟用 SSL'],
  ['plugin_connection_network_handlers_connection_ssl_optional', '所有 SSL 參數均為選填。'],
  ['plugin_connection_network_handlers_connection_ssl_description', '若伺服器設定要求 SSL 憑證，您必須指定憑證。此頁面的設定會覆寫驅動程式屬性。'],
  [
    'plugin_connection_network_handlers_connection_ssl_note',
    '{arg:productName} 不會驗證 SSL 設定，而是依賴驅動程式實作。詳情請參閱驅動程式說明文件。',
  ],
  ['plugin_connection_network_handlers_connection_ssl_docs', 'SSL 設定說明文件'],
  ['plugin_connection_network_handlers_save_credentials_for_user', '儲存目前使用者的認證資訊'],
  ['plugin_connection_network_handlers_save_credentials_for_user_tooltip', '這些認證資訊將用於自動連線'],
  ['plugin_connection_network_handlers_save_credentials_shared', '為所有具有存取權的使用者儲存認證資訊'],
  ['plugin_connection_network_handlers_save_credentials_shared_tooltip', '這些認證資訊將用於所有具有存取權的使用者自動連線'],
];
