/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { AUTH_PROVIDER_LOCAL_ID, AuthProviderService, AuthProvidersResource, AuthSettingsService } from '@cloudbeaver/core-authentication';
import { FormContext, type PlaceholderComponent, s, useExecutor, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import type { IConfigurationPlaceholderProps } from '@cloudbeaver/plugin-administration';

import { AnonymousAccessCard } from './AnonymousAccessCard.js';
import { AuthenticationProviderCard } from './AuthenticationProviderCard.js';
import { AuthenticationProviderFilters } from './AuthenticationProviderFilters.js';
import styles from './AuthenticationProviders.module.css';
import { ServerConfigurationAdminForm } from './ServerConfigurationAdminForm.js';
import { useAuthenticationProviderList } from './useAuthenticationProviderList.js';

export const AuthenticationProviders: PlaceholderComponent<IConfigurationPlaceholderProps> = observer(function AuthenticationProviders({
  state: { serverConfig },
  configurationWizard,
}) {
  const authProviderService = useService(AuthProviderService);
  const providers = useResource(AuthenticationProviders, AuthProvidersResource, CachedMapAllKey);
  const translate = useTranslate();
  const formContext = useContext(FormContext);
  const authSettingsService = useService(AuthSettingsService);
  const classes = useS(styles);
  const list = useAuthenticationProviderList(providers.resource, serverConfig, configurationWizard);

  if (formContext === null) {
    throw new Error('Form state should be provided');
  }

  const localProvider = providers.resource.get(AUTH_PROVIDER_LOCAL_ID);
  const externalAuthentication = list.providerList.length === 0;
  const authenticationDisabled = serverConfig.enabledAuthProviders?.length === 0;
  const isAnonymousAccessDisabled = authSettingsService.disableAnonymousAccess;
  const showAnonymousAccess = !!localProvider && !isAnonymousAccessDisabled && serverConfig.anonymousAccessEnabled != null;

  useExecutor({
    executor: formContext.onChange,
    handlers: [
      function switchControls() {
        if (serverConfig.enabledAuthProviders?.length === 0) {
          if (localProvider && !isAnonymousAccessDisabled) {
            serverConfig.anonymousAccessEnabled = true;
          }
        }

        if (serverConfig.enabledAuthProviders?.length) {
          serverConfig.enabledAuthProviders = serverConfig.enabledAuthProviders.filter(providerId => {
            const provider = providers.resource.get(providerId);
            return !provider?.requiredFeatures.some(feat => !serverConfig.enabledFeatures?.includes(feat));
          });
        }
      },
    ],
  });

  if (externalAuthentication) {
    return null;
  }

  return (
    <div className={s(classes, { layout: true })}>
      <AuthenticationProviderFilters list={list} />
      {(showAnonymousAccess || list.visibleProviders.length > 0) && (
        <div
          role="list"
          aria-label={translate('authentication_administration_server_configuration_authentication')}
          className={s(classes, { list: true })}
        >
          {showAnonymousAccess && <AnonymousAccessCard serverConfig={serverConfig} disabled={authenticationDisabled} />}
          {list.visibleProviders.map(provider => {
            const links = authProviderService.getServiceDescriptionLinks(provider);

            return (
              <AuthenticationProviderCard
                key={provider.id}
                provider={provider}
                serverConfig={serverConfig}
                actionsSlot={
                  links.length > 0
                    ? links.map(link => {
                        const Description = link.description();
                        return <Description key={link.id} configurationWizard={configurationWizard} />;
                      })
                    : undefined
                }
              />
            );
          })}
        </div>
      )}
      {configurationWizard && localProvider && <ServerConfigurationAdminForm serverConfig={serverConfig} />}
    </div>
  );
});
