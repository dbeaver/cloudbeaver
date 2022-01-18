/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { BASE_CONTAINERS_STYLES, Group, GroupTitle, Switch } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { ServerConfigInput } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

interface Props {
  serverConfig: ServerConfigInput;
}

export const ServerConfigurationSecurityForm = observer<Props>(function ServerConfigurationSecurityForm({
  serverConfig,
}) {
  const translate = useTranslate();
  return styled(useStyles(BASE_CONTAINERS_STYLES))(
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
    </Group>
  );
});
