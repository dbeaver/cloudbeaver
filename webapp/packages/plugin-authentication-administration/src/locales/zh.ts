/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export default [
  ['authentication_administration_user_connections_user_add', '创建用户'],
  ['authentication_administration_user_connections_user_new', '新用户'],
  ['authentication_administration_user_connections_access_load_fail', '用户授予的连接加载失败'],
  ['authentication_administration_user_connections_access_connections_load_fail', '连接加载失败'],
  ['authentication_administration_user_connections_access', '连接访问'],
  ['authentication_administration_user_connections_access_granted_by', '授予者'],
  ['authentication_administration_user_connections_access_granted_directly', '直接'],
  ['authentication_administration_user_connections_access_granted_unmanaged', '不受管理的'],
  ['authentication_administration_user_connections_empty', '没有可用连接'],
  ['authentication_administration_user_origin_empty', '没有可用详情'],
  ['authentication_administration_user_info', '信息'],
  ['authentication_administration_user_auth_method', '认证方式'],
  ['authentication_administration_user_auth_methods', '认证方式'],
  ['authentication_administration_user_auth_methods_empty', '无可用认证方式'],
  ['authentication_administration_user_auth_method_no_details', '无可用详情'],
  ['authentication_administration_user_local', '本地用户'],
  ['authentication_administration_item', '用户和群组'],
  ['authentication_administration_item_users', '用户'],
  ['authentication_administration_item_metaParameters', '元参数'],
  ['authentication_administration_tools_add_tooltip', '添加新用户'],
  ['authentication_administration_tools_refresh_tooltip', '刷新用户列表'],
  ['authentication_administration_tools_delete_tooltip', '删除选中的用户'],
  ['authentication_administration_tools_refresh_success', '用户列表已刷新'],
  ['authentication_administration_tools_refresh_fail', '用户更新失败'],
  ['authentication_administration_user_delete_fail', '删除用户出错'],
  ['authentication_administration_user_update_failed', '保存用户出错'],
  ['authentication_administration_user_updated', '用户信息已更新'],
  ['authentication_administration_user_created', '创建用户成功'],
  ['authentication_administration_user_create_failed', '创建新用户出错'],
  ['authentication_administration_users_delete_confirmation', '您将删除这些用户：'],
  ['authentication_administration_users_filters_search_placeholder', '搜索用户名称...'],
  ['authentication_administration_users_filters_status_enabled', '启用'],
  ['authentication_administration_users_filters_status_disabled', '禁用'],
  ['authentication_administration_users_filters_status_all', '全部'],
  ['authentication_administration_users_empty', '无用户'],
  ['authentication_administration_users_delete_user', '删除用户'],
  ['authentication_administration_users_delete_user_fail', '删除用户失败'],
  ['authentication_administration_users_delete_user_success', '用户已删除'],
  ['authentication_administration_users_disable_user_fail', '删除用户失败'],
  ['authentication_administration_users_disable_user_success', '用户已禁用'],

  ['authentication_administration_user_delete_credentials_error', '删除用户凭证失败'],
  ['authentication_administration_user_delete_credentials_success', '用户凭证已移除'],
  [
    'authentication_administration_user_delete_credentials_confirmation_message',
    '确定要从“{arg：userId}”中删除“{arg：originName}”身份验证方法吗?',
  ],

  ['administration_configuration_wizard_configuration_admin', '管理员凭据'],
  ['administration_configuration_wizard_configuration_admin_name', '登录'],
  ['administration_configuration_wizard_configuration_admin_password', '密码'],
  ['administration_configuration_wizard_configuration_anonymous_access', '允许匿名访问'],
  ['administration_configuration_wizard_configuration_anonymous_access_description', '允许在没有用户身份验证的情况下使用CloudBeaver'],
  ['administration_configuration_wizard_configuration_authentication_group', '认证设置'],
  ['administration_configuration_wizard_configuration_services_group', '服务'],
  ['administration_configuration_wizard_configuration_services', '服务'],
  ['administration_configuration_wizard_configuration_authentication', '启用用户认证'],
  ['administration_configuration_wizard_configuration_authentication_description', '允许用户进行身份验证。否则仅启用匿名访问'],
  [
    'authentication_administration_users_delete_user_confirmation_input_description',
    'Please type in the username of the account to confirm its deletion.',
  ],
  ['authentication_administration_users_delete_user_confirmation_input_placeholder', 'Type username here...'],
  [
    'authentication_administration_users_delete_user_disable_info',
    'Are you sure you want to delete "{arg:username}"? If you just want to prevent access temporarily, you can choose to disable the account instead.',
  ],
  [
    'authentication_administration_users_delete_user_info',
    'Deleting this account will permanently remove all associated user data from the system. Please confirm you want to proceed with deletion of "{arg:username}" user.',
  ],

  ['administration_identity_providers_tab_title', '身份提供者'],
  ['administration_identity_providers_provider', '提供者'],
  ['administration_identity_providers_provider_id', 'ID'],
  ['administration_identity_providers_provider_configuration_name', '配置名称'],
  ['administration_identity_providers_provider_configuration_disabled', '已禁用'],
  ['administration_identity_providers_provider_configuration_description', '描述'],
  ['administration_identity_providers_provider_configuration_icon_url', '图标URL'],
  ['administration_identity_providers_provider_configuration_parameters', '参数'],
  ['administration_identity_providers_provider_configuration_links', '链接'],
  ['administration_identity_providers_provider_configuration_links_metadata', '下载元数据文件'],
  ['administration_identity_providers_wizard_description', '添加身份提供者'],
  ['administration_identity_providers_configuration_add', '创建配置'],
  ['administration_identity_providers_choose_provider_placeholder', '选择提供者...'],
  ['administration_identity_providers_add_tooltip', '添加新配置'],
  ['administration_identity_providers_refresh_tooltip', '刷新配置列表'],
  ['administration_identity_providers_delete_tooltip', '删除选中配置'],
  ['administration_identity_providers_delete_confirmation', '您将删除这些配置：'],
  ['administration_identity_providers_provider_save_error', '保存配置出错'],
  ['administration_identity_providers_provider_create_error', '创建配置出错'],
  ['administration_identity_providers_configuration_list_update_success', '配置列表已刷新'],
  ['administration_identity_providers_configuration_list_update_fail', '配置列表刷新失败'],
  ['administration_identity_providers_service_link', '编辑配置'],

  ['administration_teams_team_description', '描述'],
  ['administration_teams_team_permissions', 'Permissions'],
  ['administration_teams_team_info_created', 'Team created'],
  ['administration_teams_team_info_updated', 'Team updated'],
  ['administration_teams_team_info_id_invalid', "Field '{alias:administration_teams_team_id}' can't be empty"],
  ['administration_teams_team_info_exists', "A team with ID '{arg:teamId}' already exists"],

  ['administration_teams_team_granted_users_tab_title', '用户'],
  ['administration_teams_team_granted_users_search_placeholder', '搜索用户ID...'],
  ['administration_teams_team_granted_users_user_id', '用户ID'],
  ['administration_teams_team_granted_users_user_name', '用户名称'],
  ['administration_teams_team_granted_users_empty', '没有可用用户'],
  ['administration_teams_team_granted_users_permission_denied', '您不能编辑自己的权限'],

  ['administration_teams_team_granted_connections_tab_title', '连接'],
  ['administration_teams_team_granted_connections_search_placeholder', '搜索连接名称...'],
  ['administration_teams_team_granted_connections_empty', '没有可用连接'],

  ['plugin_authentication_administration_user_team_default_readonly_tooltip', "Default team. Can't be revoked"],
  ['plugin_authentication_administration_team_default_users_tooltip', 'Default team. Contains all users'],
  ['plugin_authentication_administration_team_user_team_role_supervisor', 'Supervisor'],
  ['plugin_authentication_administration_team_user_team_role_supervisor_description', 'Supervisors can view their team’s executed queries'],
];
