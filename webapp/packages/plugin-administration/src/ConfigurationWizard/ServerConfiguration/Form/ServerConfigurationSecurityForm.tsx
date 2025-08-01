/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Group, GroupTitle, Placeholder, Switch, useTranslate, type PlaceholderComponent } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ServerConfigurationService, type IConfigurationPlaceholderProps } from '../ServerConfigurationService.js';

export const ServerConfigurationSecurityForm: PlaceholderComponent<IConfigurationPlaceholderProps> = observer(
  function ServerConfigurationSecurityForm({ state, configurationWizard }) {
    const translate = useTranslate();
    const serverConfig = state.serverConfig;
    const serverConfigurationService = useService(ServerConfigurationService);

    return (
      <Group form gap>
        <GroupTitle>{translate('administration_configuration_wizard_configuration_security')}</GroupTitle>
        <Switch
          name="adminCredentialsSaveEnabled"
          state={serverConfig}
          description={translate('administration_configuration_wizard_configuration_security_admin_credentials_description')}
          mod={['primary']}
          small
          autoHide
        >
          {translate('administration_configuration_wizard_configuration_security_admin_credentials')}
        </Switch>
        <Switch
          name="publicCredentialsSaveEnabled"
          state={serverConfig}
          description={translate('administration_configuration_wizard_configuration_security_public_credentials_description')}
          mod={['primary']}
          disabled={!serverConfig.adminCredentialsSaveEnabled}
          small
          autoHide
        >
          {translate('administration_configuration_wizard_configuration_security_public_credentials')}
        </Switch>
        <Placeholder container={serverConfigurationService.securitySettingsContainer} configurationWizard={configurationWizard} state={state} />
      </Group>
    );
  },
);
