export default [
  ['administration_server_configuration_save_confirmation_title', 'Mise à jour des paramètres du serveur'],
  ['administration_server_configuration_save_confirmation_message', 'Vous êtes sur le point de changer des paramètres critiques. Êtes-vous sûr?'],

  ['administration_configuration_wizard_welcome', 'Bienvenue'],
  ['administration_configuration_wizard_welcome_step_description', 'Bienvenue sur {alias:product_full_name}'],
  ['administration_configuration_wizard_welcome_title', 'Bienvenue sur {alias:product_full_name}, le système de gestion de base de données cloud!'],
  [
    'administration_configuration_wizard_welcome_message',
    "L'assistant de configuration facile vous guidera à travers plusieurs étapes simples pour configurer le serveur. Vous devrez définir les informations du serveur et les identifiants de l'administrateur. Vous pourrez configurer des paramètres supplémentaires du serveur une fois la configuration facile terminée.",
  ],
  [
    'administration_configuration_wizard_welcome_note',
    "Note : vous pourrez changer ces paramètres de configuration plus tard dans le panneau d'administration.",
  ],

  ['administration_configuration_wizard_configuration', 'Configuration du serveur'],
  ['administration_configuration_wizard_configuration_step_description', 'Configuration principale du serveur'],
  ['administration_configuration_wizard_configuration_title', 'Vous pouvez configurer ici les paramètres principaux du serveur.'],
  ['administration_configuration_wizard_configuration_save_error', 'Failed to save server configuration'],
  [
    'administration_configuration_wizard_configuration_message',
    "Vous pourrez ajouter des services supplémentaires après la configuration du serveur.\nL'administrateur est un super utilisateur qui peut configurer le serveur, définir les connexions aux bases de données, gérer les autres utilisateurs et bien plus encore. Veuillez vous souvenir du mot de passe saisi. Il n'est pas possible de récupérer automatiquement le mot de passe de l'administrateur.",
  ],

  ['administration_configuration_tools_save_tooltip', 'Enregistrer la configuration'],
  ['administration_configuration_tools_cancel_tooltip', 'Réinitialiser les modifications'],

  ['administration_configuration_wizard_configuration_server_info', 'Informations sur le serveur'],
  ['administration_configuration_wizard_configuration_server_name', 'Nom du serveur'],
  ['administration_configuration_wizard_configuration_server_url', 'URL du serveur'],
  ['administration_configuration_wizard_configuration_server_url_description', "URL d'accès global au serveur"],
  ['administration_configuration_wizard_configuration_server_info_unsaved_title', 'Paramètres non enregistrés'],
  [
    'administration_configuration_wizard_configuration_server_info_unsaved_message',
    'Les paramètres peuvent être enregistrés sur la page de configuration du serveur',
  ],
  ['administration_configuration_wizard_configuration_server_info_unsaved_navigate', 'Ouvrir'],
  ['administration_configuration_wizard_configuration_server_session_lifetime', 'Durée de la session, min'],
  [
    'administration_configuration_wizard_configuration_server_session_lifetime_description',
    "Ici, vous pouvez spécifier le nombre de minutes pendant lesquelles vous souhaitez que la session reste inactive avant qu'elle n'expire",
  ],

  ['administration_configuration_wizard_configuration_plugins', 'Configuration'],
  ['administration_configuration_wizard_configuration_custom_connections', 'Activer les connexions privées'],
  ['administration_configuration_wizard_configuration_custom_connections_description', 'Permet aux utilisateurs de créer des connexions privées'],
  ['administration_configuration_wizard_configuration_navigation_tree_view', 'Vue simple du navigateur'],
  [
    'administration_configuration_wizard_configuration_navigation_tree_view_description',
    "Par défaut, toutes les nouvelles connexions des utilisateurs ne contiendront que des informations de base dans l'arborescence de navigation",
  ],

  ['administration_configuration_wizard_configuration_security', 'Sécurité'],
  ['administration_configuration_wizard_configuration_security_admin_credentials', 'Enregistrer les identifiants'],
  [
    'administration_configuration_wizard_configuration_security_admin_credentials_description',
    "Permet d'enregistrer les identifiants pour la base de données préconfigurée",
  ],
  ['administration_configuration_wizard_configuration_security_public_credentials', 'Enregistrer les identifiants des utilisateurs'],
  [
    'administration_configuration_wizard_configuration_security_public_credentials_description',
    "Permet d'enregistrer les identifiants pour les utilisateurs non administrateurs",
  ],

  ['administration_configuration_wizard_configuration_navigator', 'Navigateur'],
  ['administration_configuration_wizard_configuration_navigator_hide_folders', 'Masquer les dossiers'],
  ['administration_configuration_wizard_configuration_navigator_hide_schemas', 'Masquer les schémas'],
  ['administration_configuration_wizard_configuration_navigator_hide_virtual_model', 'Masquer le modèle virtuel'],
  ['administration_configuration_wizard_configuration_navigator_merge_entities', 'Fusionner les entités'],
  ['administration_configuration_wizard_configuration_navigator_show_only_entities', 'Seulement les entités'],
  ['administration_configuration_wizard_configuration_navigator_show_system_objects', 'Objets système'],
  ['administration_configuration_wizard_configuration_navigator_show_utility_objects', 'Objets utilitaires'],

  ['administration_configuration_wizard_step_validation_message', "Échec du passage à l'étape suivante"],

  ['administration_configuration_wizard_finish', 'Confirmation'],
  ['administration_configuration_wizard_finish_step_description', 'Confirmation'],
  ['administration_configuration_wizard_finish_title', "C'est presque terminé."],
  [
    'administration_configuration_wizard_finish_message',
    "Appuyez sur le bouton Terminer pour compléter la configuration du serveur. Vous pouvez revenir aux pages précédentes si vous souhaitez modifier ou ajouter quelque chose.\nLorsque la configuration est terminée, tous les paramètres saisis seront appliqués à votre serveur. Vous serez redirigé vers la page principale pour commencer à travailler.\nVous pouvez toujours vous connecter au système en tant qu'administrateur pour modifier les paramètres du serveur.",
  ],

  ['administration_disabled_drivers_title', 'Pilotes désactivés'],
  ['administration_disabled_drivers_search_placeholder', 'Rechercher le pilote...'],
  [
    'administration_disabled_drivers_enable_unsafe_driver_message',
    'Enabling this database driver may allow access to files on the server where this application is running. This could potentially expose sensitive system files or other protected data.\n\nOnly proceed if you fully understand the implications and trust the database configuration. Unauthorized or improper use of this driver may lead to security risks.\n\nDo you want to enable the "{arg:driverName}" driver?',
  ],
];
