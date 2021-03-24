/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { AuthProvidersResource, AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { BASE_CONTAINERS_STYLES, Container, Group, GroupTitle, Loader, PlaceholderComponent, SwitchNew, useDataResource } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import type { IConfigurationPlaceholderProps } from '@cloudbeaver/plugin-administration';

import { ServerConfigurationAdminForm } from './ServerConfigurationAdminForm';

export const AuthenticationProviders: PlaceholderComponent<IConfigurationPlaceholderProps> = observer(function AuthenticationProviders({
  serverConfig,
  configurationWizard,
}) {
  const providers = useDataResource(AuthProvidersResource, undefined);
  const translate = useTranslate();
  const styles = useStyles(BASE_CONTAINERS_STYLES);
  const disabled = providers.data.length === 1 && !providers.resource.has(AUTH_PROVIDER_LOCAL_ID);

  return styled(styles)(
    <Container wrap gap>
      <Group key='authentication' form gap medium>
        <GroupTitle>{translate('administration_configuration_wizard_configuration_authentication_group')}</GroupTitle>
        <SwitchNew
          name="anonymousAccessEnabled"
          state={serverConfig}
          description={translate('administration_configuration_wizard_configuration_anonymous_access_description')}
          mod={['primary']}
          disabled={!serverConfig.authenticationEnabled}
          small
          autoHide
        >
          {translate('administration_configuration_wizard_configuration_anonymous_access')}
        </SwitchNew>
        {!disabled && (
          <SwitchNew
            name="authenticationEnabled"
            state={serverConfig}
            description={translate('administration_configuration_wizard_configuration_authentication_description')}
            mod={['primary']}
            disabled={serverConfig.enabledAuthProviders.length === 0}
            small
            autoHide
          >
            {translate('administration_configuration_wizard_configuration_authentication')}
          </SwitchNew>
        )}
        <Loader state={providers}>
          {() => !disabled && styled(styles)(
            <>
              <GroupTitle>{translate('administration_configuration_wizard_configuration_authentication_provider')}</GroupTitle>
              {providers.data.map(provider => (
                <SwitchNew
                  key={provider.id}
                  value={provider.id}
                  name="enabledAuthProviders"
                  state={serverConfig}
                  description={provider.description}
                  mod={['primary']}
                  small
                  autoHide
                >
                  {provider.label}
                </SwitchNew>
              ))}
            </>
          )}
        </Loader>
      </Group>
      {configurationWizard && (
        <ServerConfigurationAdminForm serverConfig={serverConfig} />
      )}
    </Container>
  );
});
