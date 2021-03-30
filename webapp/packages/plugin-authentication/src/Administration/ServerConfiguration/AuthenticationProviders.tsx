/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import styled from 'reshadow';

import { AuthProvidersResource, AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { BASE_CONTAINERS_STYLES, Container, FormContext, Group, GroupTitle, Loader, PlaceholderComponent, SwitchNew, useExecutor, useMapResource } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import type { IConfigurationPlaceholderProps } from '@cloudbeaver/plugin-administration';

import { ServerConfigurationAdminForm } from './ServerConfigurationAdminForm';

export const AuthenticationProviders: PlaceholderComponent<IConfigurationPlaceholderProps> = observer(function AuthenticationProviders({
  state: { serverConfig },
  configurationWizard,
}) {
  const providers = useMapResource(AuthProvidersResource, AuthProvidersResource.keyAll);
  const translate = useTranslate();
  const styles = useStyles(BASE_CONTAINERS_STYLES);
  const formContext = useContext(FormContext);

  if (formContext === null) {
    throw new Error('Form state should be provided');
  }

  const localExists = providers.resource.has(AUTH_PROVIDER_LOCAL_ID);
  const externalAuthentication = providers.data.length === 1 && !localExists;
  const providersSelectable = providers.data.length > 1;

  useExecutor({
    executor: formContext.changeExecutor,
    handlers: [function switchControls() {
      if (externalAuthentication) {
        serverConfig.enabledAuthProviders = [...providers.resource.keys];
        serverConfig.authenticationEnabled = true;
      }

      if (serverConfig.enabledAuthProviders?.length === 0) {
        serverConfig.authenticationEnabled = false;
      }

      if (!serverConfig.authenticationEnabled) {
        serverConfig.anonymousAccessEnabled = true;
      }
    }],
  });

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
        <SwitchNew
          name="authenticationEnabled"
          state={serverConfig}
          description={translate('administration_configuration_wizard_configuration_authentication_description')}
          mod={['primary']}
          disabled={serverConfig.enabledAuthProviders?.length === 0}
          small
          autoHide
        >
          {translate('administration_configuration_wizard_configuration_authentication')}
        </SwitchNew>
        <Loader state={providers}>
          {() => providersSelectable && styled(styles)(
            <>
              <GroupTitle>{translate('administration_configuration_wizard_configuration_authentication_provider')}</GroupTitle>
              {providers.data.map(provider => provider && (
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
      {configurationWizard && localExists ? (
        <ServerConfigurationAdminForm serverConfig={serverConfig} />
      ) : (
        <Container medium />
      )}
      <Container medium />
    </Container>
  );
});
