/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export default [
  ['administration_server_configuration_save_confirmation_title', 'Изменение настроек сервера'],
  ['administration_server_configuration_save_confirmation_message', 'Будут изменены критичные настройки. Вы уверены?'],

  ['administration_configuration_wizard_configuration', 'Настройки сервера'],
  ['administration_configuration_wizard_configuration_save_error', 'Не удалось сохранить конфигурацию сервера'],

  ['administration_configuration_wizard_configuration_server_info', 'Информация о сервере'],
  ['administration_configuration_wizard_configuration_server_name', 'Название сервера'],
  ['administration_configuration_wizard_configuration_server_url', 'URL Сервера'],
  ['administration_configuration_wizard_configuration_server_info_unsaved', 'Есть несохранённые изменения'],
  ['administration_configuration_wizard_configuration_server_session_lifetime', 'Время сессии, мин'],
  [
    'administration_configuration_wizard_configuration_server_session_lifetime_description',
    'В случае бездействия пользователя на протяжении указанного количества минут, его сессия будет закрыта.',
  ],

  ['administration_configuration_tools_save_tooltip', 'Сохранить конфигурацию'],
  ['administration_configuration_tools_cancel_tooltip', 'Отменить изменения'],

  ['administration_configuration_wizard_configuration_plugins', 'Настройки'],
  ['administration_configuration_wizard_configuration_custom_connections', 'Разрешить пользовательские подключения'],
  ['administration_configuration_wizard_configuration_custom_connections_description', 'Позволяет пользователям создавать собственные подключения'],
  ['administration_configuration_wizard_configuration_navigation_tree_view', 'Упрощенная версия дерева навигации'],
  [
    'administration_configuration_wizard_configuration_navigation_tree_view_description',
    'Все новые подключения, созданные пользователем, будут иметь только базовую информацию в дереве навигации',
  ],

  ['administration_configuration_wizard_step_validation_message', 'Не удалось перейти к следующему шагу'],

  ['administration_configuration_wizard_configuration_security', 'Безопасность'],
  ['administration_configuration_wizard_configuration_security_admin_credentials', 'Позволить сохранять приватные данные'],
  ['administration_configuration_wizard_configuration_security_public_credentials', 'Позволить сохранять приватные данные для пользователей'],
  [
    'administration_configuration_wizard_configuration_security_admin_credentials_description',
    'Позволяет сохранять приватные данные для настроенных подключений',
  ],
  [
    'administration_configuration_wizard_configuration_security_public_credentials_description',
    'Позволяет сохранять приватные данные (такие как пароли и SSH ключи) для пользователей, не являющихся администраторами',
  ],

  ['administration_disabled_drivers_title', 'Отключенные драйверы'],
  ['administration_disabled_drivers_search_placeholder', 'Поиск по драйверу...'],
  [
    'administration_disabled_drivers_enable_unsafe_driver_message',
    'Включение этого драйвера базы данных может позволить доступ к файлам на сервере, где работает это приложение. Это может привести к потенциальному раскрытию конфиденциальных системных файлов или другой защищённой информации.\n\nПродолжайте только в том случае, если вы полностью понимаете последствия и уверены в безопасности использования этого драйвера. Неавторизованное или ненадлежащее использование может привести к проблемам с безопасностью.\n\nВы действительно хотите включить "{arg:driverName}" драйвер?',
  ],
];
