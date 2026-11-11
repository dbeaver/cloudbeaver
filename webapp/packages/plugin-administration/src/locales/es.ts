/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['administration_server_configuration_settings_connections', 'Conexiones'],
  ['administration_server_configuration_settings_ai', 'IA'],
  ['administration_server_configuration_settings_cloud', 'Nube'],
  ['administration_server_configuration_settings_workspace', 'Espacio de trabajo'],
  ['administration_server_configuration_tab_drivers', 'Controladores'],
  ['administration_server_configuration_save_confirmation_title', 'Actualizar configuración del servidor'],
  ['administration_server_configuration_save_confirmation_message', 'Va a cambiar ajustes críticos. ¿Está seguro?'],
  ['administration_configuration_wizard_welcome', 'Bienvenido'],
  ['administration_configuration_wizard_welcome_step_description', 'Bienvenido a {alias:product_full_name}'],
  ['administration_configuration_wizard_welcome_title', 'Bienvenido a {alias:product_full_name}, el sistema de gestión de bases de datos en la nube'],
  [
    'administration_configuration_wizard_welcome_message',
    'El asistente de configuración le guiará por unos sencillos pasos para configurar el servidor. Deberá indicar la información del servidor y las credenciales del administrador. Podrá configurar parámetros adicionales al terminar la configuración inicial.',
  ],
  ['administration_configuration_wizard_welcome_note', 'Nota: podrá cambiar estos parámetros más adelante en el panel de administración.'],
  ['administration_configuration_wizard_configuration', 'Configuración del servidor'],
  ['administration_configuration_wizard_configuration_step_description', 'Configuración principal del servidor'],
  [
    'administration_configuration_wizard_configuration_description',
    'Configure los parámetros principales del servidor. Puede añadir más servicios al completar la configuración.',
  ],
  [
    'administration_configuration_wizard_configuration_password_warning',
    'Recuerde la contraseña del administrador. No se puede recuperar automáticamente.',
  ],
  ['administration_configuration_wizard_configuration_save_error', 'No se pudo guardar la configuración del servidor'],
  ['administration_configuration_tools_save_tooltip', 'Guardar configuración'],
  ['administration_configuration_tools_cancel_tooltip', 'Restablecer cambios'],
  ['administration_configuration_wizard_configuration_secure_cookies', 'Forzar modo HTTPS'],
  [
    'administration_configuration_wizard_configuration_secure_cookies_description',
    'Active HTTPS obligatorio para proteger la comunicación entre servidor y cliente. Recomendado en producción. Compruebe que su proxy HTTPS esté bien configurado para que la aplicación funcione correctamente',
  ],
  [
    'administration_configuration_wizard_configuration_secure_cookies_warning',
    'Los datos no se cifrarán si se desactiva el modo HTTPS obligatorio. Esto los hace vulnerables',
  ],
  ['administration_configuration_wizard_configuration_secure_cookies_docs', 'Documentación de configuración del proxy del servidor'],
  ['administration_configuration_wizard_configuration_supported_hosts', 'URL del servidor permitidas'],
  [
    'administration_configuration_wizard_configuration_supported_hosts_description',
    'Puede especificar varias URL del servidor separadas por saltos de línea. Un valor vacío permite todas las URL. El acceso desde direcciones IP siempre está permitido.',
  ],
  [
    'administration_configuration_wizard_configuration_supported_hosts_warning',
    'No puede eliminar su dominio actual ({arg:host}). Abra la configuración del servidor desde otro dominio permitido o una dirección IP para eliminar este dominio.',
  ],
  ['administration_configuration_wizard_configuration_server_info', 'Información del servidor'],
  ['administration_configuration_wizard_configuration_server_name', 'Nombre del servidor'],
  ['administration_configuration_wizard_configuration_server_url', 'URL del servidor'],
  ['administration_configuration_wizard_configuration_server_url_description', 'URL del servidor para acceso global'],
  ['administration_configuration_wizard_configuration_server_info_unsaved_title', 'Configuración sin guardar'],
  [
    'administration_configuration_wizard_configuration_server_info_unsaved_message',
    'La configuración se puede guardar en la página de configuración del servidor',
  ],
  ['administration_configuration_wizard_configuration_server_info_unsaved_navigate', 'Abrir'],
  ['administration_configuration_wizard_configuration_server_session_lifetime', 'Duración de la sesión, min'],
  [
    'administration_configuration_wizard_configuration_server_session_lifetime_description',
    'Aquí puede indicar cuántos minutos puede permanecer inactiva la sesión antes de caducar',
  ],
  ['administration_configuration_wizard_configuration_plugins', 'Funciones'],
  ['administration_configuration_wizard_configuration_custom_connections', 'Activar conexiones privadas'],
  ['administration_configuration_wizard_configuration_custom_connections_description', 'Permite a los usuarios crear conexiones privadas'],
  ['administration_configuration_wizard_configuration_navigation_tree_view', 'Vista simplificada del navegador'],
  [
    'administration_configuration_wizard_configuration_navigation_tree_view_description',
    'De forma predeterminada, todas las conexiones nuevas del usuario contendrán solo información básica en el árbol de navegación',
  ],
  ['administration_configuration_wizard_configuration_security', 'Seguridad'],
  ['administration_configuration_wizard_configuration_security_admin_credentials', 'Guardar credenciales'],
  [
    'administration_configuration_wizard_configuration_security_admin_credentials_description',
    'Permite guardar credenciales de bases de datos preconfiguradas',
  ],
  ['administration_configuration_wizard_configuration_security_public_credentials', 'Guardar credenciales de usuarios'],
  [
    'administration_configuration_wizard_configuration_security_public_credentials_description',
    'Permite guardar credenciales de usuarios que no son administradores',
  ],
  [
    'administration_configuration_wizard_configuration_security_db_user_password_change',
    'Permitir cambiar la contraseña del usuario de base de datos',
  ],
  [
    'administration_configuration_wizard_configuration_security_db_user_password_change_description',
    'Permite a los usuarios cambiar la contraseña del usuario asociado a una conexión de base de datos',
  ],
  ['administration_configuration_wizard_configuration_navigator', 'Navegador'],
  ['administration_configuration_wizard_configuration_navigator_hide_folders', 'Ocultar carpetas'],
  ['administration_configuration_wizard_configuration_navigator_hide_schemas', 'Ocultar esquemas'],
  ['administration_configuration_wizard_configuration_navigator_hide_virtual_model', 'Ocultar modelo virtual'],
  ['administration_configuration_wizard_configuration_navigator_merge_entities', 'Combinar entidades'],
  ['administration_configuration_wizard_configuration_navigator_show_only_entities', 'Solo entidades'],
  ['administration_configuration_wizard_configuration_navigator_show_system_objects', 'Objetos del sistema'],
  ['administration_configuration_wizard_configuration_navigator_show_utility_objects', 'Objetos auxiliares'],
  ['administration_configuration_wizard_step_validation_message', 'No se pudo avanzar al siguiente paso'],
  ['administration_configuration_wizard_finish', 'Confirmación'],
  ['administration_configuration_wizard_finish_step_description', 'Confirmación'],
  ['administration_configuration_wizard_finish_title', 'Ya casi está.'],
  [
    'administration_configuration_wizard_finish_message',
    'Pulse Finalizar para completar la configuración del servidor. Puede volver a las páginas anteriores si desea cambiar o añadir algo.\nAl completar la configuración, se aplicarán al servidor todos los ajustes introducidos. Se le redirigirá a la página principal para empezar a trabajar.\nSiempre puede iniciar sesión como administrador para cambiar la configuración del servidor.',
  ],
  ['administration_disabled_drivers_title', 'Controladores desactivados'],
  ['administration_disabled_drivers_search_placeholder', 'Buscar controlador...'],
  [
    'administration_disabled_drivers_enable_unsafe_driver_message',
    'Activar este controlador de base de datos puede permitir el acceso a archivos del servidor donde se ejecuta esta aplicación. Esto podría exponer archivos confidenciales del sistema u otros datos protegidos.\n\nContinúe solo si comprende las implicaciones y confía en la configuración de la base de datos. El uso no autorizado o incorrecto de este controlador puede generar riesgos de seguridad.\n\n¿Desea activar el controlador "{arg:driverName}"?',
  ],
];
