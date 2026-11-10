/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['administration_server_configuration_settings_connections', 'Conexiuni'],
  ['administration_server_configuration_settings_ai', 'AI'],
  ['administration_server_configuration_settings_cloud', 'Cloud'],
  ['administration_server_configuration_settings_workspace', 'Spațiu de lucru'],
  ['administration_server_configuration_tab_drivers', 'Drivere'],
  ['administration_server_configuration_save_confirmation_title', 'Actualizarea setărilor serverului'],
  ['administration_server_configuration_save_confirmation_message', 'Urmează să modifici setări critice. Sigur vrei să continui?'],
  ['administration_configuration_wizard_welcome', 'Bun venit'],
  ['administration_configuration_wizard_welcome_step_description', 'Bun venit în {alias:product_full_name}'],
  ['administration_configuration_wizard_welcome_title', 'Bun venit în {alias:product_full_name}, sistemul de gestionare a bazelor de date în cloud'],
  [
    'administration_configuration_wizard_welcome_message',
    'Expertul de configurare simplă te va ghida prin câțiva pași simpli pentru configurarea serverului. Va trebui să introduci informațiile serverului și datele de autentificare ale administratorului. Poți configura parametri suplimentari ai serverului după finalizarea configurării simple.',
  ],
  [
    'administration_configuration_wizard_welcome_note',
    'Notă: vei putea modifica ulterior acești parametri de configurare din panoul de administrare.',
  ],
  ['administration_configuration_wizard_configuration', 'Configurarea serverului'],
  ['administration_configuration_wizard_configuration_step_description', 'Configurația principală a serverului'],
  [
    'administration_configuration_wizard_configuration_description',
    'Configurează parametrii principali ai serverului. Poți adăuga mai multe servicii după finalizarea configurării.',
  ],
  ['administration_configuration_wizard_configuration_password_warning', 'Reține parola administratorului. Aceasta nu poate fi recuperată automat.'],
  ['administration_configuration_wizard_configuration_save_error', 'Nu s-a putut salva configurația serverului'],
  ['administration_configuration_tools_save_tooltip', 'Salvează configurația'],
  ['administration_configuration_tools_cancel_tooltip', 'Resetează modificările'],
  ['administration_configuration_wizard_configuration_secure_cookies', 'Impune modul HTTPS'],
  [
    'administration_configuration_wizard_configuration_secure_cookies_description',
    'Activează impunerea HTTPS pentru a securiza comunicarea dintre server și client. Recomandat în producție. Asigură-te că proxy-ul HTTPS este configurat corect pentru funcționarea aplicației',
  ],
  [
    'administration_configuration_wizard_configuration_secure_cookies_warning',
    'Datele nu vor fi criptate dacă modul HTTPS impus este dezactivat. Acest lucru le face vulnerabile',
  ],
  ['administration_configuration_wizard_configuration_secure_cookies_docs', 'Documentația de configurare a proxy-ului serverului'],
  ['administration_configuration_wizard_configuration_supported_hosts', 'URL-uri permise pentru server'],
  [
    'administration_configuration_wizard_configuration_supported_hosts_description',
    'Poți specifica mai multe URL-uri ale serverului, separate printr-o linie nouă. O valoare goală înseamnă că toate URL-urile sunt permise. Accesul prin adrese IP este întotdeauna permis.',
  ],
  [
    'administration_configuration_wizard_configuration_supported_hosts_warning',
    'Nu poți elimina domeniul curent ({arg:host}). Deschide configurația serverului de pe alt domeniu permis sau de la o adresă IP pentru a elimina acest domeniu.',
  ],
  ['administration_configuration_wizard_configuration_server_info', 'Informații despre server'],
  ['administration_configuration_wizard_configuration_server_name', 'Numele serverului'],
  ['administration_configuration_wizard_configuration_server_url', 'URL-ul serverului'],
  ['administration_configuration_wizard_configuration_server_url_description', 'URL-ul de acces global la server'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_title', 'Setări nesalvate'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_message', 'Setările pot fi salvate pe pagina de configurare a serverului'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_navigate', 'Deschide'],
  ['administration_configuration_wizard_configuration_server_session_lifetime', 'Durata sesiunii, min'],
  [
    'administration_configuration_wizard_configuration_server_session_lifetime_description',
    'Aici poți specifica numărul de minute de inactivitate permise înainte ca sesiunea să expire',
  ],
  ['administration_configuration_wizard_configuration_plugins', 'Funcționalități'],
  ['administration_configuration_wizard_configuration_custom_connections', 'Activează conexiunile private'],
  ['administration_configuration_wizard_configuration_custom_connections_description', 'Permite utilizatorilor să creeze conexiuni private'],
  ['administration_configuration_wizard_configuration_navigation_tree_view', 'Vizualizare simplă a navigatorului'],
  [
    'administration_configuration_wizard_configuration_navigation_tree_view_description',
    'În mod implicit, toate conexiunile noi ale utilizatorului vor conține doar informații de bază în arborele de navigare',
  ],
  ['administration_configuration_wizard_configuration_security', 'Securitate'],
  ['administration_configuration_wizard_configuration_security_admin_credentials', 'Salvează datele de autentificare'],
  [
    'administration_configuration_wizard_configuration_security_admin_credentials_description',
    'Permite salvarea datelor de autentificare pentru bazele de date preconfigurate',
  ],
  ['administration_configuration_wizard_configuration_security_public_credentials', 'Salvează datele de autentificare ale utilizatorilor'],
  [
    'administration_configuration_wizard_configuration_security_public_credentials_description',
    'Permite salvarea datelor de autentificare pentru utilizatorii care nu sunt administratori',
  ],
  ['administration_configuration_wizard_configuration_security_db_user_password_change', 'Permite schimbarea parolei utilizatorului bazei de date'],
  [
    'administration_configuration_wizard_configuration_security_db_user_password_change_description',
    'Permite utilizatorilor să schimbe parola utilizatorului asociat unei conexiuni la baza de date',
  ],
  ['administration_configuration_wizard_configuration_navigator', 'Navigator'],
  ['administration_configuration_wizard_configuration_navigator_hide_folders', 'Ascunde dosarele'],
  ['administration_configuration_wizard_configuration_navigator_hide_schemas', 'Ascunde schemele'],
  ['administration_configuration_wizard_configuration_navigator_hide_virtual_model', 'Ascunde modelul virtual'],
  ['administration_configuration_wizard_configuration_navigator_merge_entities', 'Combină entitățile'],
  ['administration_configuration_wizard_configuration_navigator_show_only_entities', 'Doar entități'],
  ['administration_configuration_wizard_configuration_navigator_show_system_objects', 'Obiecte de sistem'],
  ['administration_configuration_wizard_configuration_navigator_show_utility_objects', 'Obiecte utilitare'],
  ['administration_configuration_wizard_step_validation_message', 'Nu s-a putut trece la pasul următor'],
  ['administration_configuration_wizard_finish', 'Confirmare'],
  ['administration_configuration_wizard_finish_step_description', 'Confirmare'],
  ['administration_configuration_wizard_finish_title', 'Aproape am terminat.'],
  [
    'administration_configuration_wizard_finish_message',
    'Apasă butonul Finalizare pentru a încheia configurarea serverului. Poți reveni la paginile anterioare dacă vrei să modifici sau să adaugi ceva.\nDupă finalizarea configurării, toate setările introduse vor fi aplicate serverului. Vei fi redirecționat la pagina principală pentru a începe lucrul.\nTe poți conecta oricând în sistem ca administrator pentru a modifica setările serverului.',
  ],
  ['administration_disabled_drivers_title', 'Drivere dezactivate'],
  ['administration_disabled_drivers_search_placeholder', 'Caută driverul...'],
  [
    'administration_disabled_drivers_enable_unsafe_driver_message',
    'Activarea acestui driver de bază de date poate permite accesul la fișierele de pe serverul pe care rulează aplicația. Acest lucru ar putea expune fișiere de sistem sensibile sau alte date protejate.\n\nContinuă doar dacă înțelegi pe deplin implicațiile și ai încredere în configurația bazei de date. Utilizarea neautorizată sau necorespunzătoare a acestui driver poate genera riscuri de securitate.\n\nVrei să activezi driverul „{arg:driverName}”?',
  ],
];
