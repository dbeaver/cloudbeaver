/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import React, { useContext } from 'react';
import styled from 'reshadow';

import { AuthProviderService, AuthProvidersResource, AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { BASE_CONTAINERS_STYLES, FormContext, Group, GroupTitle, Loader, PlaceholderComponent, Switch, useExecutor, useMapResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';
import type { IConfigurationPlaceholderProps } from '@cloudbeaver/plugin-administration';

import { ServerConfigurationAdminForm } from './ServerConfigurationAdminForm';

export const AuthenticationProviders: PlaceholderComponent<IConfigurationPlaceholderProps> = observer(function AuthenticationProviders({
  state: { serverConfig },
  configurationWizard,
}) {
  const authProviderService = useService(AuthProviderService);
  const providers = useMapResource(AuthenticationProviders, AuthProvidersResource, CachedMapAllKey);
  const translate = useTranslate();
  const styles = useStyles(BASE_CONTAINERS_STYLES);
  const formContext = useContext(FormContext);

  if (formContext === null) {
    throw new Error('Form state should be provided');
  }

  const providerList = providers.resource.values.filter(provider => {
    if (configurationWizard && provider.configurable) {
      return false;
    }

    return true;
  });

  const localProvider = providers.resource.get(AUTH_PROVIDER_LOCAL_ID);
  const primaryProvider = providers.resource.get(providers.resource.getPrimary());
  const externalAuthentication = localProvider === undefined && providerList.length === 1;
  const authenticationDisabled = serverConfig.enabledAuthProviders?.length === 0;

  useExecutor({
    executor: formContext.changeExecutor,
    handlers: [function switchControls() {
      if (serverConfig.enabledAuthProviders?.length === 0) {
        if (localProvider) {
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
    }],
  });

  if (externalAuthentication) {
    return null;
  }

  return styled(styles)(
    <React.Fragment>
      <Group key='authentication' form gap>
        <GroupTitle>{translate('administration_configuration_wizard_configuration_authentication_group')}</GroupTitle>
        {localProvider && (
          <>
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
          </>
        )}
        <Loader state={providers} inline>
          {() => styled(styles)(
            <>
              {providerList.map(provider => {
                const links = authProviderService.getServiceDescriptionLinks(provider);
                let disabled = provider.requiredFeatures.some(feat => !serverConfig.enabledFeatures?.includes(feat));
                const tooltip = disabled ? `Following services need to be enabled: "${provider.requiredFeatures.join(', ')}"` : '';

                if (
                  !localProvider
                  && primaryProvider?.id === provider.id
                  && serverConfig.enabledAuthProviders?.length === 1
                  && serverConfig.enabledAuthProviders.includes(provider.id)
                ) {
                  disabled = true;
                }

                if (
                  configurationWizard
                  && (
                    disabled
                    || provider.id !== AUTH_PROVIDER_LOCAL_ID
                  )
                ) {
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
                    description={(
                      <>
                        {provider.description}
                        {links.map(link => {
                          const Description = link.description();
                          return <Description key={link.id} configurationWizard={configurationWizard} />;
                        })}
                      </>
                    )}
                    mod={['primary']}
                    disabled={disabled}
                    small
                    autoHide
                  >
                    {provider.label}
                  </Switch>
                );
              })}
            </>
          )}
        </Loader>
      </Group>
      {configurationWizard && localProvider && (
        <ServerConfigurationAdminForm serverConfig={serverConfig} />
      )}
    </React.Fragment>
  );
});
