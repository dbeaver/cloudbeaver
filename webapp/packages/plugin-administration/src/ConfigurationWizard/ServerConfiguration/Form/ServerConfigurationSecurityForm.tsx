/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { FormGroup, InputGroup, Switch } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { ServerConfigInput } from '@cloudbeaver/core-sdk';

interface Props {
  serverConfig: ServerConfigInput;
}

export const ServerConfigurationSecurityForm: React.FC<Props> = observer(function ServerConfigurationSecurityForm({
  serverConfig,
}) {
  const translate = useTranslate();

  return (
    <>
      <FormGroup>
        <InputGroup long>{translate('administration_configuration_wizard_configuration_security')}</InputGroup>
      </FormGroup>
      <FormGroup>
        <Switch
          name='adminCredentialsSaveEnabled'
          description={translate('administration_configuration_wizard_configuration_security_admin_credentials_description')}
          mod={['primary']}
          state={serverConfig}
          autoHide
          long
        >
          {translate('administration_configuration_wizard_configuration_security_admin_credentials')}
        </Switch>
      </FormGroup>
      <FormGroup>
        <Switch
          name='publicCredentialsSaveEnabled'
          description={translate('administration_configuration_wizard_configuration_security_public_credentials_description')}
          mod={['primary']}
          state={serverConfig}
          disabled={!serverConfig.adminCredentialsSaveEnabled}
          autoHide
          long
        >
          {translate('administration_configuration_wizard_configuration_security_public_credentials')}
        </Switch>
      </FormGroup>
    </>
  );
});
