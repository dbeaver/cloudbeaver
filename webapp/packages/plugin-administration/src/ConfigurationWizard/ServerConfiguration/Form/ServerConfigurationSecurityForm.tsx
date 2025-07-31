/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Combobox, Group, GroupTitle, Switch, useTranslate } from '@cloudbeaver/core-blocks';
import type { IServerConfig } from '../IServerConfigurationFormPartState.js';

interface Props {
  serverConfig: IServerConfig;
}

export const ServerConfigurationSecurityForm = observer<Props>(function ServerConfigurationSecurityForm({ serverConfig }) {
  const translate = useTranslate();

  const BIND_SESSION_TO_IP_OPTIONS = [
    { value: 'Enabled', label: translate('administration_configuration_wizard_configuration_security_bind_session_to_ip_enabled') },
    { value: 'Disabled', label: translate('administration_configuration_wizard_configuration_security_bind_session_to_ip_disabled') },
    { value: 'Databases.team', label: translate('administration_configuration_wizard_configuration_security_bind_session_to_ip_databases_team') },
  ];

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
      <ComboboxCombobox
        state={serverConfig}
        name="bindSessionToIp"
        items={BIND_SESSION_TO_IP_OPTIONS}
        keySelector={item => item.value}
        valueSelector={item => item.label}
        description={translate('administration_configuration_wizard_configuration_security_bind_session_to_ip_description')}
      >
        {translate('administration_configuration_wizard_configuration_security_bind_session_to_ip')}
      </Combobox>
    </Group>
  );
});
