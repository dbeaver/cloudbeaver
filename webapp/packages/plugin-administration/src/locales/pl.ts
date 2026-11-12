/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['administration_server_configuration_settings_connections', 'Połączenia'],
  ['administration_server_configuration_settings_ai', 'AI'],
  ['administration_server_configuration_settings_cloud', 'Chmura'],
  ['administration_server_configuration_settings_workspace', 'Obszar roboczy'],
  ['administration_server_configuration_tab_drivers', 'Sterowniki'],
  ['administration_server_configuration_save_confirmation_title', 'Aktualizacja ustawień serwera'],
  ['administration_server_configuration_save_confirmation_message', 'Zamierzasz zmienić krytyczne ustawienia. Czy na pewno?'],
  ['administration_configuration_wizard_welcome', 'Witamy'],
  ['administration_configuration_wizard_welcome_step_description', 'Witamy w {alias:product_full_name}'],
  ['administration_configuration_wizard_welcome_title', 'Witamy w {alias:product_full_name}, chmurowym systemie zarządzania bazami danych'],
  [
    'administration_configuration_wizard_welcome_message',
    'Kreator łatwej konfiguracji przeprowadzi Cię przez kilka prostych kroków konfiguracji serwera. Musisz podać informacje o serwerze i dane uwierzytelniające administratora. Dodatkowe parametry serwera możesz ustawić po zakończeniu łatwej konfiguracji.',
  ],
  ['administration_configuration_wizard_welcome_note', 'Uwaga: te parametry konfiguracji będzie można później zmienić w panelu administracyjnym.'],
  ['administration_configuration_wizard_configuration', 'Konfiguracja serwera'],
  ['administration_configuration_wizard_configuration_step_description', 'Główna konfiguracja serwera'],
  [
    'administration_configuration_wizard_configuration_description',
    'Skonfiguruj główne parametry serwera. Po zakończeniu konfiguracji możesz dodać więcej usług.',
  ],
  ['administration_configuration_wizard_configuration_password_warning', 'Zapamiętaj hasło administratora. Nie można go odzyskać automatycznie.'],
  ['administration_configuration_wizard_configuration_save_error', 'Nie udało się zapisać konfiguracji serwera'],
  ['administration_configuration_tools_save_tooltip', 'Zapisz konfigurację'],
  ['administration_configuration_tools_cancel_tooltip', 'Zresetuj zmiany'],
  ['administration_configuration_wizard_configuration_secure_cookies', 'Wymuś tryb HTTPS'],
  [
    'administration_configuration_wizard_configuration_secure_cookies_description',
    'Włącz wymuszanie HTTPS, aby zabezpieczyć komunikację serwera z klientem. Zalecane w środowisku produkcyjnym. Upewnij się, że serwer proxy HTTPS jest poprawnie skonfigurowany, aby aplikacja działała prawidłowo',
  ],
  [
    'administration_configuration_wizard_configuration_secure_cookies_warning',
    'Dane nie będą szyfrowane, jeśli wymuszanie HTTPS jest wyłączone. Naraża je to na zagrożenia',
  ],
  ['administration_configuration_wizard_configuration_secure_cookies_docs', 'Dokumentacja konfiguracji serwera proxy'],
  ['administration_configuration_wizard_configuration_supported_hosts', 'Dozwolone adresy URL serwera'],
  [
    'administration_configuration_wizard_configuration_supported_hosts_description',
    'Możesz podać wiele adresów URL serwera, każdy w osobnym wierszu. Pusta wartość oznacza, że wszystkie adresy URL są dozwolone. Dostęp przez adresy IP jest zawsze dozwolony.',
  ],
  [
    'administration_configuration_wizard_configuration_supported_hosts_warning',
    'Nie możesz usunąć bieżącej domeny ({arg:host}). Aby ją usunąć, otwórz konfigurację serwera z innej dozwolonej domeny lub adresu IP.',
  ],
  ['administration_configuration_wizard_configuration_server_info', 'Informacje o serwerze'],
  ['administration_configuration_wizard_configuration_server_name', 'Nazwa serwera'],
  ['administration_configuration_wizard_configuration_server_url', 'Adres URL serwera'],
  ['administration_configuration_wizard_configuration_server_url_description', 'Adres URL globalnego dostępu do serwera'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_title', 'Niezapisane ustawienia'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_message', 'Ustawienia można zapisać na stronie konfiguracji serwera'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_navigate', 'Otwórz'],
  ['administration_configuration_wizard_configuration_server_session_lifetime', 'Czas życia sesji, min'],
  [
    'administration_configuration_wizard_configuration_server_session_lifetime_description',
    'Tutaj możesz określić liczbę minut bezczynności, po których sesja wygaśnie',
  ],
  ['administration_configuration_wizard_configuration_plugins', 'Funkcje'],
  ['administration_configuration_wizard_configuration_custom_connections', 'Włącz połączenia prywatne'],
  ['administration_configuration_wizard_configuration_custom_connections_description', 'Pozwala użytkownikom tworzyć połączenia prywatne'],
  ['administration_configuration_wizard_configuration_navigation_tree_view', 'Uproszczony widok nawigatora'],
  [
    'administration_configuration_wizard_configuration_navigation_tree_view_description',
    'Domyślnie wszystkie nowe połączenia użytkownika będą zawierać tylko podstawowe informacje w drzewie nawigacji',
  ],
  ['administration_configuration_wizard_configuration_security', 'Bezpieczeństwo'],
  ['administration_configuration_wizard_configuration_security_admin_credentials', 'Zapisuj dane uwierzytelniające'],
  [
    'administration_configuration_wizard_configuration_security_admin_credentials_description',
    'Pozwala zapisywać dane uwierzytelniające dla wstępnie skonfigurowanych baz danych',
  ],
  ['administration_configuration_wizard_configuration_security_public_credentials', 'Zapisuj dane uwierzytelniające użytkowników'],
  [
    'administration_configuration_wizard_configuration_security_public_credentials_description',
    'Pozwala zapisywać dane uwierzytelniające użytkowników niebędących administratorami',
  ],
  ['administration_configuration_wizard_configuration_security_db_user_password_change', 'Zezwalaj na zmianę hasła użytkownika bazy danych'],
  [
    'administration_configuration_wizard_configuration_security_db_user_password_change_description',
    'Pozwala użytkownikom zmieniać hasło użytkownika powiązanego z połączeniem z bazą danych',
  ],
  ['administration_configuration_wizard_configuration_navigator', 'Nawigator'],
  ['administration_configuration_wizard_configuration_navigator_hide_folders', 'Ukryj foldery'],
  ['administration_configuration_wizard_configuration_navigator_hide_schemas', 'Ukryj schematy'],
  ['administration_configuration_wizard_configuration_navigator_hide_virtual_model', 'Ukryj model wirtualny'],
  ['administration_configuration_wizard_configuration_navigator_merge_entities', 'Scal encje'],
  ['administration_configuration_wizard_configuration_navigator_show_only_entities', 'Tylko encje'],
  ['administration_configuration_wizard_configuration_navigator_show_system_objects', 'Obiekty systemowe'],
  ['administration_configuration_wizard_configuration_navigator_show_utility_objects', 'Obiekty pomocnicze'],
  ['administration_configuration_wizard_step_validation_message', 'Nie udało się przejść do następnego kroku'],
  ['administration_configuration_wizard_finish', 'Potwierdzenie'],
  ['administration_configuration_wizard_finish_step_description', 'Potwierdzenie'],
  ['administration_configuration_wizard_finish_title', 'To już prawie wszystko.'],
  [
    'administration_configuration_wizard_finish_message',
    'Naciśnij przycisk Zakończ, aby zakończyć konfigurację serwera. Możesz wrócić do poprzednich stron, jeśli chcesz coś zmienić lub dodać.\nPo zakończeniu konfiguracji wszystkie wprowadzone ustawienia zostaną zastosowane na serwerze. Nastąpi przekierowanie na stronę główną, aby rozpocząć pracę.\nZawsze możesz zalogować się do systemu jako administrator, aby zmienić ustawienia serwera.',
  ],
  ['administration_disabled_drivers_title', 'Wyłączone sterowniki'],
  ['administration_disabled_drivers_search_placeholder', 'Szukaj sterownika...'],
  [
    'administration_disabled_drivers_enable_unsafe_driver_message',
    'Włączenie tego sterownika bazy danych może umożliwić dostęp do plików na serwerze, na którym działa aplikacja. Może to ujawnić poufne pliki systemowe lub inne chronione dane.\n\nKontynuuj tylko wtedy, gdy w pełni rozumiesz konsekwencje i ufasz konfiguracji bazy danych. Nieuprawnione lub niewłaściwe użycie tego sterownika może prowadzić do zagrożeń bezpieczeństwa.\n\nCzy chcesz włączyć sterownik „{arg:driverName}”?',
  ],
];
