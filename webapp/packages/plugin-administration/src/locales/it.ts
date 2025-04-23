export default [
  ['administration_server_configuration_save_confirmation_title', 'Aggiornamento delle impostazioni del Server'],
  ['administration_server_configuration_save_confirmation_message', 'Stai per modificare impostazioni critiche. Sei sicuro?'],

  ['administration_configuration_wizard_welcome', 'Benvenuto'],
  ['administration_configuration_wizard_welcome_step_description', 'Benvenuto a CloudBeaver'],
  ['administration_configuration_wizard_welcome_title', 'Benvenuto a CloudBeaver, il sistema di gestione database in cloud!'],
  [
    'administration_configuration_wizard_welcome_message',
    'Il semplice wizard di configurazione ti guiderà per diversi semplici passi per configurare il tuo server. Dovrai impostare informazioni sul server e le credenziali amministrative. Potrai inoltre aggiungere la tua prima connessione al database.',
  ],
  [
    'administration_configuration_wizard_welcome_note',
    'Nota: potrai in seguito modificare questi parametri di configurazione sul pannello di amministrazione.',
  ],

  ['administration_configuration_wizard_configuration', 'Configurazione del Server'],
  ['administration_configuration_wizard_configuration_step_description', 'Configurazione del server principale'],
  ['administration_configuration_wizard_configuration_title', 'Puoi configurare i parametri del server principale qui.'],
  ['administration_configuration_wizard_configuration_save_error', 'Failed to save server configuration'],
  [
    'administration_configuration_wizard_configuration_message',
    "L'amministratore è un super utente che può configurare server, impostare connessioni ai database, gestire altri utenti e molto di più. Si prega di ricordare la password inserita: non sarà possibile recuperarla in maniera automatica.",
  ],

  ['administration_configuration_tools_save_tooltip', 'Salva la configurazione'],
  ['administration_configuration_tools_cancel_tooltip', 'Annulla le modifiche'],

  ['administration_configuration_wizard_configuration_server_info', 'Informazioni sul Server'],
  ['administration_configuration_wizard_configuration_server_name', 'Nome del Server'],
  ['administration_configuration_wizard_configuration_server_url', 'Server URL'],
  ['administration_configuration_wizard_configuration_server_url_description', 'Server URL di accesso globale'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_title', 'Impostazioni non salvate'],
  [
    'administration_configuration_wizard_configuration_server_info_unsaved_message',
    'Le impostazioni possono essere salvate sull pagina di Configurazione Server',
  ],
  ['administration_configuration_wizard_configuration_server_info_unsaved_navigate', 'Apri'],
  [
    'administration_configuration_wizard_configuration_server_session_lifetime_description',
    'Qua puoi specificare il numero di minuti che vorresti permettere alla sessione di rimanere in attesa prima che scadi',
  ],

  ['administration_configuration_wizard_configuration_plugins', 'Configurazione'],
  ['administration_configuration_wizard_configuration_custom_connections', 'Abilita connessioni custom'],
  ['administration_configuration_wizard_configuration_custom_connections_description', 'Permette agli utenti di creare connessioni custom'],
  ['administration_configuration_wizard_configuration_navigation_tree_view', 'Vista semplice del navigatore'],
  [
    'administration_configuration_wizard_configuration_navigation_tree_view_description',
    "Di default, tutte le nuove connessioni creati dagli utenti conterranno solo informazioni di base nell'albero di navigazione",
  ],

  ['administration_configuration_wizard_configuration_security', 'Sicurezza'],
  ['administration_configuration_wizard_configuration_security_admin_credentials', 'Salva le credenziali'],
  [
    'administration_configuration_wizard_configuration_security_admin_credentials_description',
    'Permetti di salvare le credenziali per database preconfigurati',
  ],
  ['administration_configuration_wizard_configuration_security_public_credentials', 'Salve le credenziali utente'],
  [
    'administration_configuration_wizard_configuration_security_public_credentials_description',
    'Permetti di salvare le credenziali per gli utenti non amministratori',
  ],

  ['administration_configuration_wizard_configuration_navigator', 'Navigatore'],
  ['administration_configuration_wizard_configuration_navigator_hide_folders', 'Nascondi le Cartelle'],
  ['administration_configuration_wizard_configuration_navigator_hide_schemas', 'Nascondi gli Schemi'],
  ['administration_configuration_wizard_configuration_navigator_hide_virtual_model', 'Nasconti i Modelli Virtuali'],
  ['administration_configuration_wizard_configuration_navigator_merge_entities', 'Unisci le entità'],
  ['administration_configuration_wizard_configuration_navigator_show_only_entities', 'Solo Entità'],
  ['administration_configuration_wizard_configuration_navigator_show_system_objects', 'Oggetti di Sistema'],
  ['administration_configuration_wizard_configuration_navigator_show_utility_objects', 'Oggetti di UtilitàUtility Objects'],

  ['administration_configuration_wizard_step_validation_message', 'Failed to proceed to the next step'],

  ['administration_configuration_wizard_finish', 'Conferma'],
  ['administration_configuration_wizard_finish_step_description', 'Conferma'],
  ['administration_configuration_wizard_finish_title', 'Ci siamo quasi.'],
  [
    'administration_configuration_wizard_finish_message',
    'Premi il pulsante Conferma per completare la configurazione del server. Puoi tornare alle pagine precedenti se vuoi modificare o aggiungere qualcosa.\nQuando la configurazione è completa le impostazioni saranno applicate al tuo server. Sarai portarto alla pagina principale.\nTi ricordiamo che puoi sempre fare login come amministratore e modificare i settaggi del server.',
  ],

  ['administration_disabled_drivers_title', 'Disabled drivers'],
  ['administration_disabled_drivers_search_placeholder', 'Search for the driver...'],
  [
    'administration_disabled_drivers_enable_unsafe_driver_message',
    'Enabling this database driver may allow access to files on the server where this application is running. This could potentially expose sensitive system files or other protected data.\n\nOnly proceed if you fully understand the implications and trust the database configuration. Unauthorized or improper use of this driver may lead to security risks.\n\nDo you want to enable the "{arg:driverName}" driver?',
  ],
];
