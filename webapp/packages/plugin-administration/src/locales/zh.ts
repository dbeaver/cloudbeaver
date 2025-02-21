/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export default [
  ['administration_server_configuration_save_confirmation_title', '服务器设置更新'],
  ['administration_server_configuration_save_confirmation_message', '即将更改关键设置。您确定吗？'],

  ['administration_configuration_wizard_welcome', '欢迎'],
  ['administration_configuration_wizard_welcome_step_description', '欢迎来到CloudBeaver'],
  ['administration_configuration_wizard_welcome_title', '欢迎来到CloudBeaver，云数据库管理系统！'],
  [
    'administration_configuration_wizard_welcome_message',
    '简单配置向导将引导您通过几个简单的步骤来设置CloudBeaver服务器。您将需要设置服务器信息和管理员凭据。您还可以在此处添加第一个数据库连接。',
  ],
  ['administration_configuration_wizard_welcome_note', '注意：稍后您能够在管理面板更改这些配置参数。'],

  ['administration_configuration_wizard_configuration', '服务器配置'],
  ['administration_configuration_wizard_configuration_step_description', '主要的服务器配置'],
  ['administration_configuration_wizard_configuration_title', '您可以在这里配置主要的服务器参数'],
  ['administration_configuration_wizard_configuration_save_error', 'Failed to save server configuration'],
  [
    'administration_configuration_wizard_configuration_message',
    '管理员是一个超级用户，可以配置服务器、设置数据库连接、管理其他用户等等。请记住输入的密码。无法自动恢复管理员密码。',
  ],

  ['administration_configuration_tools_save_tooltip', '保存配置'],
  ['administration_configuration_tools_cancel_tooltip', '重置更改'],

  ['administration_configuration_wizard_configuration_server_info', '服务器信息'],
  ['administration_configuration_wizard_configuration_server_name', '服务器名称'],
  ['administration_configuration_wizard_configuration_server_url', '服务器URL'],
  ['administration_configuration_wizard_configuration_server_url_description', '全局权限服务区URL'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_title', '未保存的设置'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_message', '服务器配置页面可以保存设置'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_navigate', '打开'],
  ['administration_configuration_wizard_configuration_server_session_lifetime_description', '您可以在此处指定您希望会话在到期前保持空闲的分钟数'],

  ['administration_configuration_wizard_configuration_plugins', '配置'],
  ['administration_configuration_wizard_configuration_custom_connections', '允许自定义连接'],
  ['administration_configuration_wizard_configuration_custom_connections_description', '允许用户创建自定义连接'],
  ['administration_configuration_wizard_configuration_navigation_tree_view', '导航器简单视图'],
  ['administration_configuration_wizard_configuration_navigation_tree_view_description', '默认情况下，所有用户的新连接在导航树中将仅包含基本信息'],

  ['administration_configuration_wizard_configuration_security', '安全'],
  ['administration_configuration_wizard_configuration_security_admin_credentials', '保存凭据'],
  ['administration_configuration_wizard_configuration_security_admin_credentials_description', '允许保存预配置数据库的凭据'],
  ['administration_configuration_wizard_configuration_security_public_credentials', '保存用户凭据'],
  ['administration_configuration_wizard_configuration_security_public_credentials_description', '允许为非管理员用户保存凭据'],

  ['administration_configuration_wizard_configuration_navigator', '导航器'],
  ['administration_configuration_wizard_configuration_navigator_hide_folders', '隐藏文件夹'],
  ['administration_configuration_wizard_configuration_navigator_hide_schemas', '隐藏结构'],
  ['administration_configuration_wizard_configuration_navigator_hide_virtual_model', '隐藏虚拟模型'],
  ['administration_configuration_wizard_configuration_navigator_merge_entities', '合并实体'],
  ['administration_configuration_wizard_configuration_navigator_show_only_entities', '仅实体'],
  ['administration_configuration_wizard_configuration_navigator_show_system_objects', '系统对象'],
  ['administration_configuration_wizard_configuration_navigator_show_utility_objects', '实用程序对象'],

  ['administration_configuration_wizard_step_validation_message', '无法继续执行下一步'],

  ['administration_configuration_wizard_finish', '确认'],
  ['administration_configuration_wizard_finish_step_description', '确认'],
  ['administration_configuration_wizard_finish_title', '差不多就这样。'],
  [
    'administration_configuration_wizard_finish_message',
    '按完成按钮完成服务器配置。如果您想更改或添加某些内容，可以返回到前面的页面。\n配置完成后，所有输入的设置都将应用于您的CloudBeaver服务器。您将被重定向到主页面开始工作。\n您可以随时以管理员身份登录系统以更改服务器设置。',
  ],

  ['administration_disabled_drivers_title', '已禁用的驱动'],
  ['administration_disabled_drivers_search_placeholder', '搜索驱动...'],
  [
    'administration_disabled_drivers_enable_unsafe_driver_message',
    'Enabling this database driver may allow access to files on the server where this application is running. This could potentially expose sensitive system files or other protected data.\n\nOnly proceed if you fully understand the implications and trust the database configuration. Unauthorized or improper use of this driver may lead to security risks.\n\nDo you want to enable the "{arg:driverName}" driver?',
  ],
];
