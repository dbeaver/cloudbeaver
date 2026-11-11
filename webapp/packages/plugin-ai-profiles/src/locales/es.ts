/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['plugin_ai_profiles_profile_menu', 'Acciones del perfil'],
  ['plugin_ai_profiles_profile_clone', 'Clonar'],
  ['plugin_ai_profiles_default_badge', '(Predeterminado)'],
  [
    'plugin_ai_profiles_default_description',
    'Perfil predeterminado para sus solicitudes de IA. Seleccione un perfil en el chat o use Establecer como predeterminado para cambiarlo.',
  ],
  ['plugin_ai_profiles_set_default', 'Establecer como predeterminado'],
  ['plugin_ai_profiles_default_save_failed', 'No se pudo guardar su perfil de IA predeterminado'],
  ['plugin_ai_profiles_scope', 'Ámbito'],
  ['plugin_ai_profiles_scope_global', 'Global'],
  ['plugin_ai_profiles_scope_user', 'Usuario'],
  ['plugin_ai_credentials_dialog_title', 'Credenciales del perfil de IA'],
  ['plugin_ai_credentials_dialog_description', 'Proporcione las credenciales que usará este perfil de IA para su cuenta de usuario.'],
  ['plugin_ai_credentials_profile', 'Perfil'],
  ['plugin_ai_credentials_engine', 'Motor'],
  ['plugin_ai_credentials_token', 'Token de API'],
  ['plugin_ai_credentials_token_required', 'Introduzca un token de API.'],
  ['plugin_ai_credentials_method', 'Método de autenticación'],
  ['plugin_ai_credentials_subscription', 'Suscripción'],
  ['plugin_ai_credentials_account', 'Cuenta de {arg:provider}'],
  ['plugin_ai_account_connect', 'Conectar cuenta'],
  ['plugin_ai_account_connected', 'Cuenta conectada'],
  ['plugin_ai_account_disconnected', 'Cuenta desconectada'],
  ['plugin_ai_account_not_connected', 'Cuenta no conectada'],
  ['plugin_ai_account_disconnect', 'Desconectar cuenta'],
  [
    'plugin_ai_account_disconnect_confirmation',
    '¿Desea desconectar su cuenta de este perfil de IA? Se conservará el token de API guardado, pero no cambiará el método de autenticación.',
  ],
  ['plugin_ai_account_disconnect_failed', 'No se pudo desconectar la cuenta'],
  ['plugin_ai_device_code', 'Código de dispositivo'],
  ['plugin_ai_device_open_provider', 'Abrir página de autorización de {arg:provider}'],
  [
    'plugin_ai_device_instructions',
    'Introduzca este código en la página del proveedor y apruebe el acceso. Mantenga esta ventana abierta durante la conexión. Si la cierra, se cancelará el intento.',
  ],
  ['plugin_ai_device_waiting', 'Esperando autorización de la cuenta…'],
  ['plugin_ai_device_expiration', 'Este código es válido durante un máximo de {arg:minutes} minutos.'],
  ['plugin_ai_device_retry', 'Volver a intentar'],
  ['plugin_ai_device_failed', 'No se pudo conectar la cuenta'],
  ['plugin_ai_device_cancel_failed', 'No se pudo cancelar la autorización de la cuenta'],
  ['plugin_ai_device_cancel_title', '¿Cancelar la autorización de la cuenta?'],
  ['plugin_ai_device_cancel_confirmation', 'La autorización de la cuenta sigue en curso. ¿Desea cancelarla?'],
  ['plugin_ai_device_cancel', 'Cancelar'],
  ['plugin_ai_device_continue', 'Continuar'],
  ['plugin_ai_credentials_reset', 'Restablecer credenciales'],
  ['plugin_ai_credentials_reset_title', 'Restablecer credenciales del perfil de IA'],
  ['plugin_ai_credentials_reset_confirmation', '¿Eliminar el token de API guardado? Se conservará la cuenta de suscripción conectada.'],
  ['plugin_ai_credentials_profile_not_found', 'No se encontró el perfil de IA'],
  ['plugin_ai_credentials_saved', 'Credenciales del perfil de IA guardadas'],
  ['plugin_ai_credentials_reset_success', 'Credenciales del perfil de IA restablecidas'],
  ['plugin_ai_credentials_save_failed', 'No se pudieron guardar las credenciales del perfil de IA'],
  ['plugin_ai_credentials_reset_failed', 'No se pudieron restablecer las credenciales del perfil de IA'],
];
