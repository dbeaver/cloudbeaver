/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['plugin_connections_delete_connection', 'Verbindung'],
  ['plugin_connections_delete_database_object', 'Datenbankobjekt'],
  ['plugin_connections_delete_read_only', 'Schreibgeschützte Verbindung.'],
  ['plugin_connections_delete_folder_warning', 'Verbindungen innerhalb der Ordner werden nur gelöscht, wenn sie ausgewählt sind.'],
  ['plugin_connections_new_connection_dialog_title', 'Neue Verbindung'],
  ['plugin_connections_connection_form_part_main', 'Allgemein'],
  ['plugin_connections_connection_form_part_main_auth_model', 'Authentifizierungsmodell'],
  ['plugin_connections_connection_form_part_properties', 'Treibereigenschaften'],
  ['plugin_connections_connection_form_part_advanced', 'Erweiterte Einstellungen'],
  ['plugin_connections_connection_form_part_initialization_settings', 'Initialisierungseinstellungen'],
  ['plugin_connections_connection_form_connection_details', 'Verbindungsdetails'],
  ['plugin_connections_connection_form_part_main_custom_host', 'Host'],
  ['plugin_connections_connection_form_part_main_custom_port', 'Port'],
  ['plugin_connections_connection_form_part_main_custom_server_name', 'Servername'],
  ['plugin_connections_connection_form_part_main_custom_database', 'Datenbank'],
  ['plugin_connections_connection_form_part_main_url_jdbc', 'JDBC-URL'],
  ['plugin_connections_connection_form_part_main_folder', 'Ordner'],
  ['plugin_connections_connection_edit_menu_item_title', 'Verbindung bearbeiten'],
  ['plugin_connections_connection_clone', 'Klonen'],
  ['plugin_connections_connection_clone_error', 'Verbindung konnte nicht geklont werden'],
  ['plugin_connections_connection_edit_reconnect_title', 'Verbindung aktualisiert'],
  ['plugin_connections_connection_edit_reconnect_message', 'Die Verbindung wurde aktualisiert. Möchten Sie sich erneut verbinden?'],
  ['plugin_connections_connection_edit_reconnect_failed', 'Erneute Verbindung fehlgeschlagen'],
  ['plugin_connections_connection_folder_move_failed', 'Verschieben in den Ordner fehlgeschlagen'],
  [
    'plugin_connections_connection_folder_move_duplication',
    'Der Zielordner oder die ausgewählten Ordner enthalten einen Ordner mit demselben Namen ({arg:name})',
  ],
  [
    'plugin_connections_connection_cloud_auth_required',
    'Sie müssen sich mit den Zugangsdaten von "{arg:providerLabel}" anmelden, um mit dieser Verbindung zu arbeiten.',
  ],
  ['plugin_connections_connection_form_project_invalid', 'Sie dürfen im ausgewählten Projekt keine Verbindungen erstellen'],
  ['plugin_connections_connection_form_host_configuration_invalid', 'Hostkonfiguration wird nicht unterstützt'],
  ['plugin_connections_connection_form_name_invalid', "Das Feld 'Verbindungsname' darf nicht leer sein"],
  ['plugin_connections_connection_form_host_invalid', "Das Feld 'Host' darf nicht leer sein"],
  [
    'plugin_connections_connection_folder_delete_confirmation',
    'Sie sind dabei, "{arg:name}" zu löschen. Verbindungen werden nicht gelöscht. Sind Sie sicher?',
  ],
  ['plugin_connections_menu_connections_label', 'Verbindung'],
  ['plugin_connections_menu_security_label', 'Sicherheit'],
  ['plugin_connections_action_disconnect_all_label', 'Alle trennen'],
  ['plugin_connections_settings', 'Verbindungen'],
  ['plugin_connections_settings_hide_connections_view_name', 'Verwaltung der Verbindungsansicht ausblenden'],
  [
    'plugin_connections_settings_hide_connections_view_description',
    'Das Untermenü für Verbindungsansichten wird für alle Benutzer außer Administratoren ausgeblendet',
  ],
  ['plugin_connections_connection_form_shared_credentials_manage_info', 'Sie können Zugangsdaten verwalten im '],
  ['plugin_connections_connection_form_shared_credentials_manage_info_tab_link', 'Tab „Zugangsdaten“'],
  [
    'plugin_connections_connection_auth_secret_description',
    'Es sind mehrere Zugangsdaten für die Authentifizierung verfügbar.\nWählen Sie die Zugangsdaten aus, die Sie verwenden möchten.',
  ],
  ['plugin_connections_connection_create_menu_title', 'Neue Verbindung'],
  [
    'plugin_connections_connection_driver_not_installed_message',
    'Treiber ist nicht installiert. Sie können ihn im Bereich "Verwaltung" installieren.',
  ],
  ['plugin_connections_connection_established', 'Verbindung hergestellt'],
  ['plugin_connections_connection_client_version', 'Clientversion: {arg:version} \n'],
  ['plugin_connections_connection_server_version', 'Serverversion: {arg:version} \n'],
  ['plugin_connections_connection_connection_time', 'Verbindungszeit: {arg:time} \n'],
  ['plugin_connections_connection_type_label', 'Verbindungstyp'],
  ['plugin_connections_change_db_password_menu_title', 'Aktuelles Datenbankpasswort ändern'],
  ['plugin_connections_change_db_password_dialog_title', 'Aktuelles Datenbankpasswort ändern'],
  ['plugin_connections_change_db_password_current', 'Aktuelles Passwort'],
  ['plugin_connections_change_db_password_new', 'Neues Passwort'],
  ['plugin_connections_change_db_password_repeat', 'Passwort bestätigen'],
  ['plugin_connections_change_db_password_submit', 'Ändern'],
  ['plugin_connections_change_db_password_success', 'Datenbankpasswort geändert'],
  ['plugin_connections_change_db_password_mismatch', 'Neue Passwörter stimmen nicht überein'],
  ['plugin_connections_change_db_password_failed', 'Passwortänderung fehlgeschlagen'],
];
