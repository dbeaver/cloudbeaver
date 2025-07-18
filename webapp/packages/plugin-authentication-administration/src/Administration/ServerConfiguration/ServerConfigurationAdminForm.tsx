/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ADMIN_USERNAME_MIN_LENGTH } from '@cloudbeaver/core-authentication';
import { Group, GroupTitle, InputField, useCustomInputValidation, usePasswordValidation, useTranslate } from '@cloudbeaver/core-blocks';
import type { ServerConfigInput } from '@cloudbeaver/core-sdk';
import { isValuesEqual } from '@cloudbeaver/core-utils';

interface Props {
  serverConfig: ServerConfigInput;
}

export const ServerConfigurationAdminForm = observer<Props>(function ServerConfigurationAdminForm({ serverConfig }) {
  const translate = useTranslate();
  const passwordValidationRef = usePasswordValidation();

  const passwordRepeatRef = useCustomInputValidation<string>(value => {
    if (!isValuesEqual(value, serverConfig.adminPassword, null)) {
      return translate('authentication_user_passwords_not_match');
    }
    return null;
  });

  return (
    <Group form gap medium>
      <GroupTitle>{translate('administration_configuration_wizard_configuration_admin')}</GroupTitle>
      <InputField type="text" name="adminName" state={serverConfig} minLength={ADMIN_USERNAME_MIN_LENGTH} required tiny>
        {translate('administration_configuration_wizard_configuration_admin_name')}
      </InputField>
      <InputField ref={passwordValidationRef} type="password" name="adminPassword" state={serverConfig} autoComplete="new-password" required tiny>
        {translate('administration_configuration_wizard_configuration_admin_password')}
      </InputField>
      {/* @ts-ignore We need adminPasswordRepeat in state to validate it on navigation, but we don't have this field in serverConfig  */}
      <InputField ref={passwordRepeatRef} state={serverConfig} type="password" name="adminPasswordRepeat" autoComplete="new-password" required tiny>
        {translate('authentication_user_password_repeat')}
      </InputField>
    </Group>
  );
});
