
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { Group, GroupTitle, BASE_CONTAINERS_STYLES, InputField, useTranslate, useStyles } from '@cloudbeaver/core-blocks';

import type { IServerConfigurationPageState } from '../IServerConfigurationPageState';

interface Props {
  state: IServerConfigurationPageState;
}

export const ServerConfigurationInfoForm = observer<Props>(function ServerConfigurationInfoForm({
  state,
}) {
  const translate = useTranslate();
  return styled(useStyles(BASE_CONTAINERS_STYLES))(
    <Group form gap>
      <GroupTitle>{translate('administration_configuration_wizard_configuration_server_info')}</GroupTitle>
      <InputField
        type="text"
        name="serverName"
        state={state.serverConfig}
        mod='surface'
        required
        medium
      >
        {translate('administration_configuration_wizard_configuration_server_name')}
      </InputField>
      <InputField
        title={translate('administration_configuration_wizard_configuration_server_url_description')}
        type="url"
        name="serverURL"
        state={state.serverConfig}
        mod='surface'
        required
        medium
      >
        {translate('administration_configuration_wizard_configuration_server_url')}
      </InputField>
      <InputField
        title={translate('administration_configuration_wizard_configuration_server_session_lifetime_description')}
        type="number"
        name="sessionExpireTime"
        state={state.serverConfig}
        mod='surface'
        min={1}
        mapState={v => (v === 0 ? 60000 : v ?? 1800000) / 1000 / 60}
        mapValue={v => (v === undefined ? 30 : Number(v) || 1) * 1000 * 60}
        required
        tiny
      >
        {translate('administration_configuration_wizard_configuration_server_session_lifetime')}
      </InputField>
    </Group>
  );
});
