/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default [
  ['plugin_ai_profiles_scope', 'Scope'],
  ['plugin_ai_profiles_scope_global', 'Global'],
  ['plugin_ai_profiles_scope_user', 'User'],
  ['plugin_ai_credentials_dialog_title', 'AI profile credentials'],
  ['plugin_ai_credentials_dialog_description', 'Provide the credentials used by this AI profile for your user account.'],
  ['plugin_ai_credentials_profile', 'Profile'],
  ['plugin_ai_credentials_engine', 'Engine'],
  ['plugin_ai_credentials_token', 'API Token'],
  ['plugin_ai_credentials_token_required', 'Enter an API token.'],
  ['plugin_ai_credentials_method', 'Authentication method'],
  ['plugin_ai_credentials_subscription', 'Subscription'],
  ['plugin_ai_credentials_account', '{arg:provider} account'],
  ['plugin_ai_account_connect', 'Connect account'],
  ['plugin_ai_account_connected', 'Account connected'],
  ['plugin_ai_account_disconnected', 'Account disconnected'],
  ['plugin_ai_account_not_connected', 'Account not connected'],
  ['plugin_ai_account_disconnect', 'Disconnect account'],
  [
    'plugin_ai_account_disconnect_confirmation',
    'Disconnect your account from this AI profile? Your saved API token will be kept, but the authentication method will not change.',
  ],
  ['plugin_ai_account_disconnect_failed', 'Failed to disconnect account'],
  ['plugin_ai_device_code', 'Device code'],
  ['plugin_ai_device_open_provider', 'Open {arg:provider} authorization page'],
  [
    'plugin_ai_device_instructions',
    'Enter this code on the provider page and approve access. Keep this window open while connecting. Closing it cancels the attempt.',
  ],
  ['plugin_ai_device_waiting', 'Waiting for account authorization…'],
  ['plugin_ai_device_expiration', 'This code is valid for up to {arg:minutes} minutes.'],
  ['plugin_ai_device_retry', 'Try again'],
  ['plugin_ai_device_failed', 'Failed to connect account'],
  ['plugin_ai_device_cancel_failed', 'Failed to cancel account authorization'],
  ['plugin_ai_credentials_reset', 'Reset Credentials'],
  ['plugin_ai_credentials_reset_title', 'Reset AI profile credentials'],
  ['plugin_ai_credentials_reset_confirmation', 'Remove the saved API token? Your connected subscription account will be kept.'],
  ['plugin_ai_credentials_profile_not_found', 'AI profile not found'],
  ['plugin_ai_credentials_saved', 'AI profile credentials saved'],
  ['plugin_ai_credentials_reset_success', 'AI profile credentials reset'],
  ['plugin_ai_credentials_save_failed', 'Failed to save AI profile credentials'],
  ['plugin_ai_credentials_reset_failed', 'Failed to reset AI profile credentials'],
];
