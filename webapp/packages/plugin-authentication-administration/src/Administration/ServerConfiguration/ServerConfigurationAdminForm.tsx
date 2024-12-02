/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ADMIN_USERNAME_MIN_LENGTH } from '@cloudbeaver/core-authentication';
import { Group, GroupTitle, InputField, usePasswordValidation, useTranslate } from '@cloudbeaver/core-blocks';
import type { ServerConfigInput } from '@cloudbeaver/core-sdk';

interface Props {
  serverConfig: ServerConfigInput;
}

export const ServerConfigurationAdminForm = observer<Props>(function ServerConfigurationAdminForm({ serverConfig }) {
  const translate = useTranslate();
  const passwordValidationRef = usePasswordValidation();

  return (
    <Group form gap medium>
      <GroupTitle>{translate('administration_configuration_wizard_configuration_admin')}</GroupTitle>
      <InputField type="text" name="adminName" state={serverConfig} minLength={ADMIN_USERNAME_MIN_LENGTH} required tiny>
        {translate('administration_configuration_wizard_configuration_admin_name')}
      </InputField>
      <InputField ref={passwordValidationRef} type="password" name="adminPassword" state={serverConfig} autoComplete="new-password" required tiny>
        {translate('administration_configuration_wizard_configuration_admin_password')}
      </InputField>
    </Group>
  );
});
