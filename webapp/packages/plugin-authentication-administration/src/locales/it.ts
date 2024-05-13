/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export default [
  ['authentication_administration_user_connections_user_add', 'Creazione di Utente'],
  ['authentication_administration_user_connections_user_new', 'Nuovo utente'],
  ['authentication_administration_user_connections_access_load_fail', "Errore in fase di caricamento delle connessioni autorizzate all'utente"],
  ['authentication_administration_user_connections_access_connections_load_fail', 'Errore in fase di caricamento delle connessioni'],
  ['authentication_administration_user_connections_access', 'Accesso alle connessioni'],
  ['authentication_administration_user_connections_access_granted_by', 'Permesso da'],
  ['authentication_administration_user_connections_access_granted_directly', 'Direttamente'],
  ['authentication_administration_user_connections_access_granted_unmanaged', 'Non gestito'],
  ['authentication_administration_user_connections_empty', 'Nessuna connessione disponibile'],
  ['authentication_administration_user_origin_empty', 'Nessun dettaglio disponibile'],
  ['authentication_administration_user_info', 'Info'],
  ['authentication_administration_user_local', 'Local user'],
  ['authentication_administration_user_auth_method', 'Auth Method'],
  ['authentication_administration_user_auth_methods', 'Auth Methods'],
  ['authentication_administration_user_auth_methods_empty', 'No available auth methods'],
  ['authentication_administration_user_auth_method_no_details', 'No details available'],
  ['authentication_administration_item', 'Utenti'],
  ['authentication_administration_tools_add_tooltip', 'Create new user'],
  ['authentication_administration_tools_refresh_tooltip', 'Aggiorna la lista utenti'],
  ['authentication_administration_tools_delete_tooltip', 'Elimina gli utenti selezionati'],
  ['authentication_administration_tools_refresh_success', 'Lista degli utenti ricaricata'],
  ['authentication_administration_tools_refresh_fail', 'Users update failed'],
  ['authentication_administration_user_delete_fail', 'Error deleting user'],
  ['authentication_administration_user_update_failed', 'Errore al salvataggio utente'],
  ['authentication_administration_user_updated', 'Utente aggiornato'],
  ['authentication_administration_user_created', 'Utente creato con successo'],
  ['authentication_administration_user_create_failed', 'Errore di creazione nuovo utente'],
  ['authentication_administration_users_filters_search_placeholder', 'Search for the user name...'],
  ['authentication_administration_users_filters_status_enabled', 'ENABLED'],
  ['authentication_administration_users_filters_status_disabled', 'DISABLED'],
  ['authentication_administration_users_filters_status_all', 'ALL'],
  ['authentication_administration_users_empty', 'There are no users'],
  ['authentication_administration_users_delete_user', 'Delete user'],
  ['authentication_administration_users_delete_user_fail', 'Failed to delete user'],
  ['authentication_administration_users_delete_user_success', 'User deleted'],
  ['authentication_administration_users_disable_user_fail', 'Failed to disable user'],
  ['authentication_administration_users_disable_user_success', 'User disabled'],
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

  ['authentication_administration_user_delete_credentials_error', 'Failed to remove user credentials'],
  ['authentication_administration_user_delete_credentials_success', 'User credentials were removed'],
  [
    'authentication_administration_user_delete_credentials_confirmation_message',
    'Are you sure you want to delete "{arg:originName}" auth method from "{arg:userId}"?',
  ],

  ['administration_teams_team_info_created', 'Team created'],
  ['administration_teams_team_info_updated', 'Team updated'],
  ['administration_teams_team_info_id_invalid', "Field '{alias:administration_teams_team_id}' can't be empty"],
  ['administration_teams_team_info_exists', "A team with ID '{arg:teamId}' already exists"],

  ['administration_configuration_wizard_configuration_admin', 'Credenziali amministrative'],
  ['administration_configuration_wizard_configuration_admin_name', 'Login'],
  ['administration_configuration_wizard_configuration_admin_password', 'Password'],
  ['administration_configuration_wizard_configuration_anonymous_access', "Permetti l'accesso anonimo"],
  ['administration_configuration_wizard_configuration_anonymous_access_description', 'Permetti di lavorare con CloudBeaver senza autenticazione'],
  ['administration_configuration_wizard_configuration_authentication_group', 'Impostazioni di autenticazione'],
  ['administration_configuration_wizard_configuration_services', 'Servizi'],
  ['administration_configuration_wizard_configuration_authentication', "Abilita l'autenticazione utente"],
  [
    'administration_configuration_wizard_configuration_authentication_description',
    "Permetti agli utenti di autenticarsi. In alternativa solo l'accesso anonimo sarà attivo",
  ],

  ['plugin_authentication_administration_user_team_default_readonly_tooltip', "Default team. Can't be revoked"],
  ['plugin_authentication_administration_team_default_users_tooltip', 'Default team. Contains all users'],
  ['plugin_authentication_administration_team_user_team_role_supervisor', 'Supervisor'],
  ['plugin_authentication_administration_team_user_team_role_supervisor_description', 'Supervisors can view their team’s executed queries'],
];
