
/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { FormGroup, InputGroup, Switch } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ServerConfigInput } from '@cloudbeaver/core-sdk';

interface Props {
  serverConfig: ServerConfigInput;
}

export const ServerConfigurationConfigurationForm: React.FC<Props> = observer(function ServerConfigurationConfigurationForm({
  serverConfig,
}) {
  const translate = useTranslate();
  return (
    <>
      <FormGroup>
        <InputGroup long>{translate('administration_configuration_wizard_configuration_plugins')}</InputGroup>
      </FormGroup>
      <FormGroup>
        <Switch
          name="anonymousAccessEnabled"
          state={serverConfig}
          description={translate('administration_configuration_wizard_configuration_anonymous_access_description')}
          mod={['primary']}
          disabled={!serverConfig.authenticationEnabled}
          long
          autoHide
        >
          {translate('administration_configuration_wizard_configuration_anonymous_access')}
        </Switch>
      </FormGroup>
      <FormGroup>
        <Switch
          name="authenticationEnabled"
          state={serverConfig}
          description={translate('administration_configuration_wizard_configuration_authentication_description')}
          mod={['primary']}
          long
          autoHide
        >
          {translate('administration_configuration_wizard_configuration_authentication')}
        </Switch>
      </FormGroup>
      <FormGroup>
        <Switch
          name="customConnectionsEnabled"
          state={serverConfig}
          description={translate('administration_configuration_wizard_configuration_custom_connections_description')}
          mod={['primary']}
          long
          autoHide
        >
          {translate('administration_configuration_wizard_configuration_custom_connections')}
        </Switch>
      </FormGroup>
    </>
  );
});
