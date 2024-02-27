/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Group, GroupTitle, InputField, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { ServerConfigResource, SESSION_EXPIRE_MIN_TIME, SESSION_TOUCH_TIME_PERIOD } from '@cloudbeaver/core-root';

import type { IServerConfigurationPageState } from '../IServerConfigurationPageState';

interface Props {
  state: IServerConfigurationPageState;
}

const INPUT_MIN_SESSION_EXPIRE_TIME = Math.ceil((SESSION_EXPIRE_MIN_TIME + SESSION_TOUCH_TIME_PERIOD) / 60000) + 1;

export const ServerConfigurationInfoForm = observer<Props>(function ServerConfigurationInfoForm({ state }) {
  const serverConfigLoader = useResource(ServerConfigurationInfoForm, ServerConfigResource, undefined);
  const translate = useTranslate();
  return (
    <Group form gap>
      <GroupTitle>{translate('administration_configuration_wizard_configuration_server_info')}</GroupTitle>
      <InputField type="text" name="serverName" state={state.serverConfig} required medium>
        {translate('administration_configuration_wizard_configuration_server_name')}
      </InputField>
      <InputField
        title={translate('administration_configuration_wizard_configuration_server_url_description')}
        type="url"
        name="serverURL"
        state={state.serverConfig}
        readOnly={serverConfigLoader.resource.distributed}
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
        min={INPUT_MIN_SESSION_EXPIRE_TIME}
        mapState={(v: number | undefined) => String((v === 0 ? 60000 : v ?? 1800000) / 1000 / 60)}
        mapValue={(v?: string) => (v === undefined ? 30 : Number(v) || 1) * 1000 * 60}
        required
        tiny
      >
        {translate('administration_configuration_wizard_configuration_server_session_lifetime')}
      </InputField>
    </Group>
  );
});
