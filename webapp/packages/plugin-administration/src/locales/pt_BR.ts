/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['administration_server_configuration_settings_connections', 'Conexões'],
  ['administration_server_configuration_settings_ai', 'IA'],
  ['administration_server_configuration_settings_cloud', 'Nuvem'],
  ['administration_server_configuration_settings_workspace', 'Espaço de trabalho'],
  ['administration_server_configuration_tab_drivers', 'Drivers'],
  ['administration_server_configuration_save_confirmation_title', 'Atualizar configurações do servidor'],
  ['administration_server_configuration_save_confirmation_message', 'Você está prestes a alterar configurações críticas. Tem certeza?'],
  ['administration_configuration_wizard_welcome', 'Bem-vindo'],
  ['administration_configuration_wizard_welcome_step_description', 'Bem-vindo ao {alias:product_full_name}'],
  [
    'administration_configuration_wizard_welcome_title',
    'Bem-vindo ao {alias:product_full_name}, o sistema de gerenciamento de bancos de dados na nuvem',
  ],
  [
    'administration_configuration_wizard_welcome_message',
    'O assistente de configuração guiará você por algumas etapas simples para configurar o servidor. Você precisará definir as informações do servidor e as credenciais do administrador. Poderá configurar parâmetros adicionais após concluir a configuração inicial.',
  ],
  ['administration_configuration_wizard_welcome_note', 'Observação: você poderá alterar esses parâmetros depois no painel de administração.'],
  ['administration_configuration_wizard_configuration', 'Configuração do servidor'],
  ['administration_configuration_wizard_configuration_step_description', 'Configuração principal do servidor'],
  [
    'administration_configuration_wizard_configuration_description',
    'Configure os parâmetros principais do servidor. Você pode adicionar mais serviços após concluir a configuração.',
  ],
  [
    'administration_configuration_wizard_configuration_password_warning',
    'Lembre-se da senha do administrador. Ela não pode ser recuperada automaticamente.',
  ],
  ['administration_configuration_wizard_configuration_save_error', 'Não foi possível salvar a configuração do servidor'],
  ['administration_configuration_tools_save_tooltip', 'Salvar configuração'],
  ['administration_configuration_tools_cancel_tooltip', 'Redefinir alterações'],
  ['administration_configuration_wizard_configuration_secure_cookies', 'Forçar modo HTTPS'],
  [
    'administration_configuration_wizard_configuration_secure_cookies_description',
    'Ative o HTTPS obrigatório para proteger a comunicação entre servidor e cliente. Recomendado para produção. Verifique se o proxy HTTPS está configurado corretamente para garantir o funcionamento do aplicativo',
  ],
  [
    'administration_configuration_wizard_configuration_secure_cookies_warning',
    'Os dados não serão criptografados se o modo HTTPS obrigatório estiver desativado. Isso os torna vulneráveis',
  ],
  ['administration_configuration_wizard_configuration_secure_cookies_docs', 'Documentação de configuração do proxy do servidor'],
  ['administration_configuration_wizard_configuration_supported_hosts', 'URLs permitidas do servidor'],
  [
    'administration_configuration_wizard_configuration_supported_hosts_description',
    'Você pode especificar várias URLs do servidor separadas por quebras de linha. Um valor vazio permite todas as URLs. O acesso por endereços IP é sempre permitido.',
  ],
  [
    'administration_configuration_wizard_configuration_supported_hosts_warning',
    'Você não pode remover seu domínio atual ({arg:host}). Abra a configuração do servidor por outro domínio permitido ou endereço IP para remover este domínio.',
  ],
  ['administration_configuration_wizard_configuration_server_info', 'Informações do servidor'],
  ['administration_configuration_wizard_configuration_server_name', 'Nome do servidor'],
  ['administration_configuration_wizard_configuration_server_url', 'URL do servidor'],
  ['administration_configuration_wizard_configuration_server_url_description', 'URL do servidor para acesso global'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_title', 'Configurações não salvas'],
  [
    'administration_configuration_wizard_configuration_server_info_unsaved_message',
    'As configurações podem ser salvas na página de configuração do servidor',
  ],
  ['administration_configuration_wizard_configuration_server_info_unsaved_navigate', 'Abrir'],
  ['administration_configuration_wizard_configuration_server_session_lifetime', 'Duração da sessão, min'],
  [
    'administration_configuration_wizard_configuration_server_session_lifetime_description',
    'Aqui você pode especificar quantos minutos a sessão pode ficar inativa antes de expirar',
  ],
  ['administration_configuration_wizard_configuration_plugins', 'Recursos'],
  ['administration_configuration_wizard_configuration_custom_connections', 'Ativar conexões privadas'],
  ['administration_configuration_wizard_configuration_custom_connections_description', 'Permite aos usuários criar conexões privadas'],
  ['administration_configuration_wizard_configuration_navigation_tree_view', 'Visualização simplificada do navegador'],
  [
    'administration_configuration_wizard_configuration_navigation_tree_view_description',
    'Por padrão, todas as novas conexões do usuário conterão apenas informações básicas na árvore de navegação',
  ],
  ['administration_configuration_wizard_configuration_security', 'Segurança'],
  ['administration_configuration_wizard_configuration_security_admin_credentials', 'Salvar credenciais'],
  [
    'administration_configuration_wizard_configuration_security_admin_credentials_description',
    'Permite salvar credenciais de bancos de dados pré-configurados',
  ],
  ['administration_configuration_wizard_configuration_security_public_credentials', 'Salvar credenciais dos usuários'],
  [
    'administration_configuration_wizard_configuration_security_public_credentials_description',
    'Permite salvar credenciais de usuários não administradores',
  ],
  ['administration_configuration_wizard_configuration_security_db_user_password_change', 'Permitir alteração da senha do usuário do banco de dados'],
  [
    'administration_configuration_wizard_configuration_security_db_user_password_change_description',
    'Permite aos usuários alterar a senha do usuário associado a uma conexão de banco de dados',
  ],
  ['administration_configuration_wizard_configuration_navigator', 'Navegador'],
  ['administration_configuration_wizard_configuration_navigator_hide_folders', 'Ocultar pastas'],
  ['administration_configuration_wizard_configuration_navigator_hide_schemas', 'Ocultar esquemas'],
  ['administration_configuration_wizard_configuration_navigator_hide_virtual_model', 'Ocultar modelo virtual'],
  ['administration_configuration_wizard_configuration_navigator_merge_entities', 'Mesclar entidades'],
  ['administration_configuration_wizard_configuration_navigator_show_only_entities', 'Somente entidades'],
  ['administration_configuration_wizard_configuration_navigator_show_system_objects', 'Objetos do sistema'],
  ['administration_configuration_wizard_configuration_navigator_show_utility_objects', 'Objetos auxiliares'],
  ['administration_configuration_wizard_step_validation_message', 'Não foi possível avançar para a próxima etapa'],
  ['administration_configuration_wizard_finish', 'Confirmação'],
  ['administration_configuration_wizard_finish_step_description', 'Confirmação'],
  ['administration_configuration_wizard_finish_title', 'Está quase pronto.'],
  [
    'administration_configuration_wizard_finish_message',
    'Clique em Concluir para finalizar a configuração do servidor. Você pode voltar às páginas anteriores se quiser alterar ou adicionar algo.\nQuando a configuração for concluída, todas as configurações inseridas serão aplicadas ao servidor. Você será redirecionado para a página principal para começar a trabalhar.\nVocê sempre pode entrar como administrador para alterar as configurações do servidor.',
  ],
  ['administration_disabled_drivers_title', 'Drivers desativados'],
  ['administration_disabled_drivers_search_placeholder', 'Pesquisar driver...'],
  [
    'administration_disabled_drivers_enable_unsafe_driver_message',
    'Ativar este driver de banco de dados pode permitir o acesso a arquivos no servidor onde este aplicativo está em execução. Isso pode expor arquivos confidenciais do sistema ou outros dados protegidos.\n\nProssiga apenas se compreender completamente as implicações e confiar na configuração do banco de dados. O uso não autorizado ou inadequado deste driver pode causar riscos de segurança.\n\nDeseja ativar o driver "{arg:driverName}"?',
  ],
];
