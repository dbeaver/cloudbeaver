/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export default [
  ['plugin_connections_connection_form_part_main', 'Principal'],
  ['plugin_connections_connection_form_part_properties', 'Propriétés du pilote'],
  ['plugin_connections_connection_form_part_main_custom_host', 'Hôte'],
  ['plugin_connections_connection_form_part_main_custom_port', 'Port'],
  ['plugin_connections_connection_form_part_main_custom_server_name', 'Nom du serveur'],
  ['plugin_connections_connection_form_part_main_custom_database', 'Base de données'],
  ['plugin_connections_connection_form_part_main_url_jdbc', 'URL JDBC'],
  ['plugin_connections_connection_form_part_main_folder', 'Dossier'],
  ['plugin_connections_new_connection_dialog_title', 'Nouvelle connexion'],

  ['plugin_connections_connection_edit_menu_item_title', 'Modifier la connexion'],
  ['plugin_connections_connection_edit_cancel_title', "Confirmation d'annulation"],
  [
    'plugin_connections_connection_edit_cancel_message',
    'Vous allez annuler les modifications de la connexion. Les modifications non enregistrées seront perdues. Êtes-vous sûr ?',
  ],
  ['plugin_connections_connection_edit_reconnect_title', 'Connexion mise à jour'],
  ['plugin_connections_connection_edit_reconnect_message', 'La connexion a été mise à jour. Voulez-vous vous reconnecter ?'],
  ['plugin_connections_connection_edit_reconnect_failed', 'Échec de la reconnexion'],
  ['plugin_connections_connection_folder_move_failed', 'Échec du déplacement vers le dossier'],
  [
    'plugin_connections_connection_folder_move_duplication',
    'Le dossier cible ou les dossiers sélectionnés contiennent un dossier portant le même nom ({arg:name})',
  ],
  [
    'plugin_connections_connection_cloud_auth_required',
    'Vous devez vous connecter avec les identifiants "{arg:providerLabel}" pour travailler avec cette connexion.',
  ],
  ['plugin_connections_connection_form_project_invalid', "Vous n'avez pas accès à la création de connexions dans le projet sélectionné"],
  ['plugin_connections_connection_form_host_configuration_invalid', "La configuration de l'hôte n'est pas supportée"],
  ['plugin_connections_connection_form_name_invalid', 'Le champ "Nom de la connexion" ne peut pas être vide'],
  ['plugin_connections_connection_form_host_invalid', 'Le champ "Hôte" ne peut pas être vide'],
  [
    'plugin_connections_connection_folder_delete_confirmation',
    'Vous allez supprimer "{arg:name}". Les connexions ne seront pas supprimées. Êtes-vous sûr ?',
  ],
  ['plugin_connections_menu_connections_label', 'Connexion'],
  ['plugin_connections_action_disconnect_all_label', 'Déconnecter tout'],
  ['plugin_connections_settings', 'Connexions'],
  ['plugin_connections_settings_hide_connections_view_name', 'Afficher les connexions uniquement aux administrateurs'],
  ['plugin_connections_settings_hide_connections_view_description', 'Afficher les connexions uniquement aux administrateurs'],

  ['plugin_connections_connection_ssl_enable', 'Activer SSL'],

  ['plugin_connections_connection_form_shared_credentials_manage_info', "Vous pouvez gérer les identifiants dans l'onglet "],
  ['plugin_connections_connection_form_shared_credentials_manage_info_tab_link', 'Onglet Identifiants'],
  ['plugin_connections_connection_auth_secret_description', 'Veuillez sélectionner les identifiants fournis par une de vos équipes'],
];
