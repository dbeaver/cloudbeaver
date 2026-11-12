/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['administration_server_configuration_settings_connections', 'Verbindungen'],
  ['administration_server_configuration_settings_ai', 'KI'],
  ['administration_server_configuration_settings_cloud', 'Cloud'],
  ['administration_server_configuration_settings_workspace', 'Arbeitsbereich'],
  ['administration_server_configuration_tab_drivers', 'Treiber'],
  ['administration_server_configuration_save_confirmation_title', 'Servereinstellungen aktualisieren'],
  ['administration_server_configuration_save_confirmation_message', 'Sie sind dabei, kritische Einstellungen zu ändern. Sind Sie sicher?'],
  ['administration_configuration_wizard_welcome', 'Willkommen'],
  ['administration_configuration_wizard_welcome_step_description', 'Willkommen bei {alias:product_full_name}'],
  ['administration_configuration_wizard_welcome_title', 'Willkommen bei {alias:product_full_name}, dem Cloud-Datenbankverwaltungssystem'],
  [
    'administration_configuration_wizard_welcome_message',
    'Der Einrichtungsassistent führt Sie in wenigen einfachen Schritten durch die Servereinrichtung. Sie müssen Serverinformationen und Administrator-Zugangsdaten festlegen. Weitere Serverparameter können Sie nach Abschluss der einfachen Einrichtung konfigurieren.',
  ],
  ['administration_configuration_wizard_welcome_note', 'Hinweis: Sie können diese Konfigurationsparameter später im Verwaltungsbereich ändern.'],
  ['administration_configuration_wizard_configuration', 'Serverkonfiguration'],
  ['administration_configuration_wizard_configuration_step_description', 'Hauptkonfiguration des Servers'],
  [
    'administration_configuration_wizard_configuration_description',
    'Konfigurieren Sie die wichtigsten Serverparameter. Nach Abschluss der Einrichtung können Sie weitere Dienste hinzufügen.',
  ],
  [
    'administration_configuration_wizard_configuration_password_warning',
    'Merken Sie sich das Administratorpasswort. Es kann nicht automatisch wiederhergestellt werden.',
  ],
  ['administration_configuration_wizard_configuration_save_error', 'Serverkonfiguration konnte nicht gespeichert werden'],
  ['administration_configuration_tools_save_tooltip', 'Konfiguration speichern'],
  ['administration_configuration_tools_cancel_tooltip', 'Änderungen zurücksetzen'],
  ['administration_configuration_wizard_configuration_secure_cookies', 'HTTPS-Modus erzwingen'],
  [
    'administration_configuration_wizard_configuration_secure_cookies_description',
    'Aktivieren Sie erzwungenes HTTPS, um die Kommunikation zwischen Server und Client zu sichern. Für den Produktivbetrieb empfohlen. Stellen Sie sicher, dass Ihr HTTPS-Proxy korrekt konfiguriert ist, damit die App ordnungsgemäß funktioniert',
  ],
  [
    'administration_configuration_wizard_configuration_secure_cookies_warning',
    'Die Daten werden nicht verschlüsselt, wenn der erzwungene HTTPS-Modus deaktiviert ist. Dadurch sind sie gefährdet',
  ],
  ['administration_configuration_wizard_configuration_secure_cookies_docs', 'Dokumentation zur Server-Proxy-Konfiguration'],
  ['administration_configuration_wizard_configuration_supported_hosts', 'Erlaubte Server-URLs'],
  [
    'administration_configuration_wizard_configuration_supported_hosts_description',
    'Sie können mehrere Server-URLs durch Zeilenumbrüche getrennt angeben. Ein leerer Wert erlaubt alle URLs. Der Zugriff über IP-Adressen ist immer erlaubt.',
  ],
  [
    'administration_configuration_wizard_configuration_supported_hosts_warning',
    'Sie können Ihre aktuelle Domain ({arg:host}) nicht entfernen. Öffnen Sie die Serverkonfiguration über eine andere erlaubte Domain oder IP-Adresse, um diese Domain zu entfernen.',
  ],
  ['administration_configuration_wizard_configuration_server_info', 'Serverinformationen'],
  ['administration_configuration_wizard_configuration_server_name', 'Servername'],
  ['administration_configuration_wizard_configuration_server_url', 'Server-URL'],
  ['administration_configuration_wizard_configuration_server_url_description', 'Server-URL für globalen Zugriff'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_title', 'Ungespeicherte Einstellungen'],
  [
    'administration_configuration_wizard_configuration_server_info_unsaved_message',
    'Einstellungen können auf der Seite „Serverkonfiguration“ gespeichert werden',
  ],
  ['administration_configuration_wizard_configuration_server_info_unsaved_navigate', 'Öffnen'],
  ['administration_configuration_wizard_configuration_server_session_lifetime', 'Sitzungsdauer, Min.'],
  [
    'administration_configuration_wizard_configuration_server_session_lifetime_description',
    'Hier können Sie die Anzahl der Minuten festlegen, die eine Sitzung inaktiv bleiben darf, bevor sie abläuft',
  ],
  ['administration_configuration_wizard_configuration_plugins', 'Funktionen'],
  ['administration_configuration_wizard_configuration_custom_connections', 'Private Verbindungen aktivieren'],
  ['administration_configuration_wizard_configuration_custom_connections_description', 'Erlaubt Benutzern, private Verbindungen zu erstellen'],
  ['administration_configuration_wizard_configuration_navigation_tree_view', 'Einfache Navigatoransicht'],
  [
    'administration_configuration_wizard_configuration_navigation_tree_view_description',
    'Standardmäßig enthalten alle neuen Verbindungen eines Benutzers nur grundlegende Informationen im Navigationsbaum',
  ],
  ['administration_configuration_wizard_configuration_security', 'Sicherheit'],
  ['administration_configuration_wizard_configuration_security_admin_credentials', 'Zugangsdaten speichern'],
  [
    'administration_configuration_wizard_configuration_security_admin_credentials_description',
    'Erlaubt das Speichern von Zugangsdaten für vorkonfigurierte Datenbanken',
  ],
  ['administration_configuration_wizard_configuration_security_public_credentials', 'Benutzerzugangsdaten speichern'],
  [
    'administration_configuration_wizard_configuration_security_public_credentials_description',
    'Erlaubt das Speichern von Zugangsdaten für Benutzer ohne Administratorrechte',
  ],
  ['administration_configuration_wizard_configuration_security_db_user_password_change', 'Ändern des Datenbankbenutzerpassworts erlauben'],
  [
    'administration_configuration_wizard_configuration_security_db_user_password_change_description',
    'Erlaubt Benutzern, das Passwort des einer Datenbankverbindung zugeordneten Benutzers zu ändern',
  ],
  ['administration_configuration_wizard_configuration_navigator', 'Navigator'],
  ['administration_configuration_wizard_configuration_navigator_hide_folders', 'Ordner ausblenden'],
  ['administration_configuration_wizard_configuration_navigator_hide_schemas', 'Schemas ausblenden'],
  ['administration_configuration_wizard_configuration_navigator_hide_virtual_model', 'Virtuelles Modell ausblenden'],
  ['administration_configuration_wizard_configuration_navigator_merge_entities', 'Entitäten zusammenführen'],
  ['administration_configuration_wizard_configuration_navigator_show_only_entities', 'Nur Entitäten'],
  ['administration_configuration_wizard_configuration_navigator_show_system_objects', 'Systemobjekte'],
  ['administration_configuration_wizard_configuration_navigator_show_utility_objects', 'Hilfsobjekte'],
  ['administration_configuration_wizard_step_validation_message', 'Fortfahren mit dem nächsten Schritt fehlgeschlagen'],
  ['administration_configuration_wizard_finish', 'Bestätigung'],
  ['administration_configuration_wizard_finish_step_description', 'Bestätigung'],
  ['administration_configuration_wizard_finish_title', 'Fast geschafft.'],
  [
    'administration_configuration_wizard_finish_message',
    'Klicken Sie auf „Fertigstellen“, um die Serverkonfiguration abzuschließen. Sie können zu den vorherigen Seiten zurückkehren, wenn Sie etwas ändern oder hinzufügen möchten.\nNach Abschluss der Konfiguration werden alle eingegebenen Einstellungen auf Ihren Server angewendet. Sie werden zur Hauptseite weitergeleitet, um mit der Arbeit zu beginnen.\nSie können sich jederzeit als Administrator anmelden, um die Servereinstellungen zu ändern.',
  ],
  ['administration_disabled_drivers_title', 'Deaktivierte Treiber'],
  ['administration_disabled_drivers_search_placeholder', 'Nach Treiber suchen...'],
  [
    'administration_disabled_drivers_enable_unsafe_driver_message',
    'Das Aktivieren dieses Datenbanktreibers kann den Zugriff auf Dateien auf dem Server ermöglichen, auf dem diese Anwendung läuft. Dadurch könnten vertrauliche Systemdateien oder andere geschützte Daten offengelegt werden.\n\nFahren Sie nur fort, wenn Sie die Auswirkungen vollständig verstehen und der Datenbankkonfiguration vertrauen. Unbefugte oder unsachgemäße Nutzung dieses Treibers kann zu Sicherheitsrisiken führen.\n\nMöchten Sie den Treiber "{arg:driverName}" aktivieren?',
  ],
];
