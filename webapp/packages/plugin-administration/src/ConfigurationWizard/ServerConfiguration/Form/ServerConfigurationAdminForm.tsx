
/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { FormGroup, InputGroup, InputField } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ServerConfigInput } from '@cloudbeaver/core-sdk';

interface Props {
  serverConfig: ServerConfigInput;
}

export const ServerConfigurationAdminForm: React.FC<Props> = observer(function ServerConfigurationAdminForm({
  serverConfig,
}) {
  const translate = useTranslate();
  return (
    <>
      <FormGroup>
        <InputGroup long>{translate('administration_configuration_wizard_configuration_admin')}</InputGroup>
      </FormGroup>
      <FormGroup>
        <InputField
          type="text"
          name="adminName"
          state={serverConfig}
          mod='surface'
          minLength={6}
          required
          long
        >
          {translate('administration_configuration_wizard_configuration_admin_name')}
        </InputField>
      </FormGroup>
      <FormGroup>
        <InputField
          type="password"
          name="adminPassword"
          state={serverConfig}
          autoComplete='new-password'
          mod='surface'
          required
          long
        >
          {translate('administration_configuration_wizard_configuration_admin_password')}
        </InputField>
      </FormGroup>
    </>
  );
});
