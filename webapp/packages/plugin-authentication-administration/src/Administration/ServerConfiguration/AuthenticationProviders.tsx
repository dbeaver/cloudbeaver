/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { useContext } from 'react';

import {
  AUTH_PROVIDER_LOCAL_ID,
  AuthProvider,
  AuthProviderService,
  AuthProvidersResource,
  AuthSettingsService,
} from '@cloudbeaver/core-authentication';
import { FormContext, Group, GroupTitle, PlaceholderComponent, Switch, useExecutor, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
import type { IConfigurationPlaceholderProps } from '@cloudbeaver/plugin-administration';

import { ServerConfigurationAdminForm } from './ServerConfigurationAdminForm';

export const AuthenticationProviders: PlaceholderComponent<IConfigurationPlaceholderProps> = observer(function AuthenticationProviders({
  state: { serverConfig },
  configurationWizard,
}) {
  const authProviderService = useService(AuthProviderService);
  const providers = useResource(AuthenticationProviders, AuthProvidersResource, CachedMapAllKey);
  const translate = useTranslate();
  const formContext = useContext(FormContext);
  const authSettingsService = useService(AuthSettingsService);

  if (formContext === null) {
    throw new Error('Form state should be provided');
  }

  const providerList = providers.data.filter<AuthProvider>((provider): provider is AuthProvider => {
    if (configurationWizard && (provider?.configurable || provider?.private)) {
      return false;
    }

    return true;
  });

  const localProvider = providers.resource.get(AUTH_PROVIDER_LOCAL_ID);
  const primaryProvider = providers.resource.get(providers.resource.getPrimary());
  const externalAuthentication = localProvider === undefined && providerList.length === 1;
  const authenticationDisabled = serverConfig.enabledAuthProviders?.length === 0;
  const isAnonymousAccessDisabled = authSettingsService.settings.getValue('disableAnonymousAccess');

  useExecutor({
    executor: formContext.onChange,
    handlers: [
      function switchControls() {
        if (serverConfig.enabledAuthProviders?.length === 0) {
          if (localProvider && !isAnonymousAccessDisabled) {
            serverConfig.anonymousAccessEnabled = true;
          } else if (primaryProvider) {
            serverConfig.enabledAuthProviders.push(primaryProvider.id);
          }
        }

        if (serverConfig.enabledAuthProviders?.length) {
          serverConfig.enabledAuthProviders = serverConfig.enabledAuthProviders.filter(providerId => {
            const provider = providers.resource.get(providerId)!;

            return !provider.requiredFeatures.some(feat => !serverConfig.enabledFeatures?.includes(feat));
          });
        }
      },
    ],
  });

  if (externalAuthentication) {
    return null;
  }

  return (
    <React.Fragment>
      <Group key="authentication" form gap>
        <GroupTitle>{translate('administration_configuration_wizard_configuration_authentication_group')}</GroupTitle>
        {localProvider && !isAnonymousAccessDisabled ? (
          <Switch
            name="anonymousAccessEnabled"
            state={serverConfig}
            description={translate('administration_configuration_wizard_configuration_anonymous_access_description')}
            mod={['primary']}
            disabled={authenticationDisabled}
            small
            autoHide
          >
            {translate('administration_configuration_wizard_configuration_anonymous_access')}
          </Switch>
        ) : null}

        {providerList.map(provider => {
          const links = authProviderService.getServiceDescriptionLinks(provider);
          let disabled = provider.requiredFeatures.some(feat => !serverConfig.enabledFeatures?.includes(feat));
          const tooltip = disabled ? `Following services need to be enabled: "${provider.requiredFeatures.join(', ')}"` : '';

          if (
            !localProvider &&
            primaryProvider?.id === provider.id &&
            serverConfig.enabledAuthProviders?.length === 1 &&
            serverConfig.enabledAuthProviders.includes(provider.id)
          ) {
            disabled = true;
          }

          if (provider.private || (configurationWizard && (disabled || provider.id !== AUTH_PROVIDER_LOCAL_ID))) {
            return null;
          }

          return (
            <Switch
              key={provider.id}
              id={`authProvider_${provider.id}`}
              title={tooltip}
              value={provider.id}
              name="enabledAuthProviders"
              state={serverConfig}
              description={
                <>
                  {provider.description}
                  {links.map(link => {
                    const Description = link.description();
                    return <Description key={link.id} configurationWizard={configurationWizard} />;
                  })}
                </>
              }
              mod={['primary']}
              disabled={disabled}
              small
              autoHide
            >
              {provider.label}
            </Switch>
          );
        })}
      </Group>
      {configurationWizard && localProvider && <ServerConfigurationAdminForm serverConfig={serverConfig} />}
    </React.Fragment>
  );
});
