/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import {
  type AuthProvider,
  type AuthProviderConfiguration,
  AuthProvidersResource,
  comparePublicAuthConfigurations,
} from '@cloudbeaver/core-authentication';
import {
  Button,
  Cell,
  Clickable,
  Container,
  Filter,
  getComputed,
  IconOrImage,
  Link,
  Loader,
  s,
  TextPlaceholder,
  Translate,
  usePromiseState,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { ITask } from '@cloudbeaver/core-executor';
import type { UserInfo } from '@cloudbeaver/core-sdk';

import { AuthenticationService } from '../../AuthenticationService.js';
import styles from './ConfigurationsList.module.css';

interface IProviderConfiguration {
  provider: AuthProvider;
  configuration: AuthProviderConfiguration;
}

interface Props {
  activeProvider: AuthProvider | null;
  activeConfiguration: AuthProviderConfiguration | null;
  providers: AuthProvider[];
  authTask: ITask<UserInfo | null> | null;
  login: (linkUser: boolean, provider?: AuthProvider, configuration?: AuthProviderConfiguration) => Promise<void>;
  onClose?: () => void;
  className?: string;
}

export const ConfigurationsList = observer<Props>(function ConfigurationsList({
  activeProvider,
  activeConfiguration,
  providers,
  authTask,
  login,
  onClose,
  className,
}) {
  const authenticationService = useService(AuthenticationService);
  const translate = useTranslate();
  const style = useS(styles);

  const [search, setSearch] = useState('');
  const authTaskState = usePromiseState(authTask);
  const authProvidersResource = useService(AuthProvidersResource);
  const configurations = getComputed<IProviderConfiguration[]>(() =>
    providers
      .map(provider =>
        (provider.configurations || []).filter(configuration => configuration.signInLink).map(configuration => ({ provider, configuration })),
      )
      .flat(),
  );

  const sortedConfigurations = configurations.slice().sort((a, b) => comparePublicAuthConfigurations(a.configuration, b.configuration));

  let filteredConfigurations: IProviderConfiguration[];
  const providerDisabled = authProvidersResource.isEnabled(activeProvider?.id || '') === false;

  if (!search) {
    filteredConfigurations = sortedConfigurations;
  }

  filteredConfigurations = sortedConfigurations.filter(({ configuration }) => {
    const target = `${configuration.displayName}${configuration.description || ''}`;
    return target.toUpperCase().includes(search.toUpperCase());
  });

  function navToIdentityProvidersSettings() {
    onClose?.();
    authenticationService.configureIdentityProvider?.();
  }

  if (configurations.length === 0) {
    return (
      <TextPlaceholder>
        {translate('authentication_configure')}
        {authenticationService.configureIdentityProvider && <Link onClick={navToIdentityProvidersSettings}>{translate('ui_configure')}</Link>}
      </TextPlaceholder>
    );
  }

  if (activeProvider && activeConfiguration) {
    return (
      <Container className={className} center>
        <Loader state={authTaskState} message="authentication_authorizing" hideException>
          <Container keepSize center>
            {providerDisabled ? (
              <TextPlaceholder>{translate('plugin_authentication_authentication_method_disabled')}</TextPlaceholder>
            ) : (
              <Button type="button" onClick={() => login(false, activeProvider, activeConfiguration)}>
                <Translate token="authentication_login" />
              </Button>
            )}
          </Container>
        </Loader>
      </Container>
    );
  }

  return (
    <Container className={className} noWrap vertical>
      {configurations.length >= 10 && (
        <Container keepSize>
          <Filter
            className={s(style, { filter: true })}
            placeholder={translate('authentication_identity_provider_search_placeholder')}
            value={search}
            onChange={setSearch}
          />
        </Container>
      )}
      <Container overflow>
        {filteredConfigurations.map(({ provider, configuration }) => {
          const icon = configuration.iconURL || provider.icon;
          const title = `${configuration.displayName}\n${configuration.description || ''}`;
          return (
            <Link key={configuration.id} title={title} wrapper onClick={() => login(false, provider, configuration)}>
              <Clickable as="div">
                <Cell
                  className={s(style, { cell: true })}
                  before={icon ? <IconOrImage className={s(style, { iconOrImage: true })} icon={icon} /> : undefined}
                  description={configuration.description}
                >
                  {configuration.displayName}
                </Cell>
              </Clickable>
            </Link>
          );
        })}
      </Container>
      <Loader state={authTaskState} message="authentication_authorizing" overlay hideException />
    </Container>
  );
});
