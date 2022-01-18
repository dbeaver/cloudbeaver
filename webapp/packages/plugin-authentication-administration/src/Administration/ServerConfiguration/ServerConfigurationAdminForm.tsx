
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { BASE_CONTAINERS_STYLES, Group, GroupTitle, InputField } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { ServerConfigInput } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

interface Props {
  serverConfig: ServerConfigInput;
}

export const ServerConfigurationAdminForm = observer<Props>(function ServerConfigurationAdminForm({
  serverConfig,
}) {
  const translate = useTranslate();
  const style = useStyles(BASE_CONTAINERS_STYLES);

  return styled(style)(
    <Group form gap medium>
      <GroupTitle>{translate('administration_configuration_wizard_configuration_admin')}</GroupTitle>
      <InputField
        type="text"
        name="adminName"
        state={serverConfig}
        minLength={6}
        mod='surface'
        required
        tiny
      >
        {translate('administration_configuration_wizard_configuration_admin_name')}
      </InputField>
      <InputField
        type="password"
        name="adminPassword"
        state={serverConfig}
        autoComplete='new-password'
        mod='surface'
        required
        tiny
      >
        {translate('administration_configuration_wizard_configuration_admin_password')}
      </InputField>
    </Group>
  );
});
