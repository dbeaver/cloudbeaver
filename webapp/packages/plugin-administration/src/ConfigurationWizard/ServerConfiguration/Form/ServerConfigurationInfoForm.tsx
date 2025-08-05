/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Group, GroupTitle, Link, IconOrImage, InputField, Switch, Textarea, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { ServerConfigResource } from '@cloudbeaver/core-root';

import type { IServerConfigurationPageState } from '../IServerConfigurationPageState.js';
import { MIN_SESSION_EXPIRE_TIME } from './MIN_SESSION_EXPIRE_TIME.js';
import { WEBSITE_LINKS } from '@cloudbeaver/core-links';

interface Props {
  state: IServerConfigurationPageState;
}

export const ServerConfigurationInfoForm = observer<Props>(function ServerConfigurationInfoForm({ state }) {
  const serverConfigLoader = useResource(ServerConfigurationInfoForm, ServerConfigResource, undefined);
  const translate = useTranslate();

  function constructSupportedHostsExample() {
    const exampleWithPort = serverConfigLoader.data?.distributed ? 'localhost' : 'localhost:5000';

    return `example.com\n${exampleWithPort}\n127.0.0.1`;
  }

  return (
    <Group form gap>
      <GroupTitle>{translate('administration_configuration_wizard_configuration_server_info')}</GroupTitle>
      <InputField type="text" name="serverName" state={state.serverConfig} required medium>
        {translate('administration_configuration_wizard_configuration_server_name')}
      </InputField>
      <Textarea
        title={translate('administration_configuration_wizard_configuration_server_url_description')}
        name="supportedHosts"
        rows={3}
        state={state.serverConfig}
        description={translate('administration_configuration_wizard_configuration_supported_hosts_description')}
        placeholder={constructSupportedHostsExample()}
      >
        {translate('administration_configuration_wizard_configuration_supported_hosts')}
      </Textarea>
      <InputField
        title={translate('administration_configuration_wizard_configuration_server_session_lifetime_description')}
        type="number"
        name="sessionExpireTime"
        state={state.serverConfig}
        min={MIN_SESSION_EXPIRE_TIME}
        mapState={(v: number | undefined) => String((v === 0 ? 60000 : (v ?? 1800000)) / 1000 / 60)}
        mapValue={(v?: string) => (v === undefined ? 30 : Number(v) || 1) * 1000 * 60}
        required
        tiny
      >
        {translate('administration_configuration_wizard_configuration_server_session_lifetime')}
      </InputField>
      <Switch
        name="forceHttps"
        state={state.serverConfig}
        description={
          <div className="tw:flex-col tw:gap-1 tw:flex tw:items-start">
            <span>{translate('administration_configuration_wizard_configuration_secure_cookies_description')}</span>
            <Link
              className="tw:flex tw:items-center tw:gap-2 tw:text-balance"
              href={WEBSITE_LINKS.PROXY_CONFIGURATION_DOCUMENTATION_PAGE}
              target="_blank"
              rel="noreferrer"
            >
              <div className="tw:flex tw:items-center tw:gap-1">
                <IconOrImage width={16} icon="/icons/documentation_link_sm.svg" />{' '}
                {translate('administration_configuration_wizard_configuration_secure_cookies_docs')}
              </div>
            </Link>
          </div>
        }
        mod={['primary']}
        small
      >
        <div className="tw:flex tw:items-center tw:gap-1.5">
          {translate('administration_configuration_wizard_configuration_secure_cookies')}
          {!state.serverConfig.forceHttps && (
            <IconOrImage
              title={translate('administration_configuration_wizard_configuration_secure_cookies_warning')}
              icon="/icons/warning_icon.svg"
              width={24}
            />
          )}
        </div>
      </Switch>
    </Group>
  );
});
