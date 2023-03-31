/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styled, { css } from 'reshadow';

import { AuthInfoService, AuthProvider, AuthProviderConfiguration, comparePublicAuthConfigurations } from '@cloudbeaver/core-authentication';
import { Filter, IconOrImage, Link, Cell, getComputed, TextPlaceholder, usePromiseState, Loader, Button, useTranslate, useStyles, Translate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { ITask } from '@cloudbeaver/core-executor';
import type { UserInfo } from '@cloudbeaver/core-sdk';


import { AuthenticationService } from '../../AuthenticationService';

const styles = css`
    container {
      display: flex;
      flex-direction: column;
      overflow: auto;
      flex: 1;
    }
    Filter {
      margin: 0 24px 12px 24px;
    }
    list {
      overflow: auto;
    }
    Cell {
      composes: theme-border-color-secondary from global;
      border-bottom: 1px solid;
      padding: 0 16px;
    }
    IconOrImage {
      width: 100%;
      height: 100%;
    }
    center {
      margin: auto;
    }
`;

const loaderStyle = css`
    ExceptionMessage {
      padding: 24px;
    }
  `;

interface IProviderConfiguration {
  provider: AuthProvider;
  configuration: AuthProviderConfiguration;
}

interface Props {
  activeProvider: AuthProvider | null;
  activeConfiguration: AuthProviderConfiguration | null;
  providers: AuthProvider[];
  onAuthorize?: (provider: AuthProvider | null, configuration: AuthProviderConfiguration | null) => void;
  onClose?: () => void;
  className?: string;
}

export const ConfigurationsList = observer<Props>(function ConfigurationsList({
  activeProvider,
  activeConfiguration,
  providers,
  onAuthorize,
  onClose,
  className,
}) {
  const authInfoService = useService(AuthInfoService);
  const authenticationService = useService(AuthenticationService);
  const notificationService = useService(NotificationService);
  const translate = useTranslate();
  const style = useStyles(styles);

  const [search, setSearch] = useState('');
  const [authTask, setAuthTask] = useState<ITask<UserInfo | null> | null>(null);
  const authTaskState = usePromiseState(authTask);
  const configurations = getComputed<IProviderConfiguration[]>(() => providers.map(
    provider => (
      (provider.configurations || [])
        .filter(configuration => configuration.signInLink)
        .map(configuration => ({ provider, configuration }))
    )).flat()
  );

  const sortedConfigurations = configurations
    .slice()
    .sort((a, b) => comparePublicAuthConfigurations(a.configuration, b.configuration));

  let filteredConfigurations: IProviderConfiguration[];

  if (!search) {
    filteredConfigurations = sortedConfigurations;
  }

  filteredConfigurations = sortedConfigurations.filter(({ configuration }) => {
    const target = `${configuration.displayName}${configuration.description || ''}`;
    return target.toUpperCase().includes(search.toUpperCase());
  });

  async function auth({ provider, configuration }: IProviderConfiguration) {
    try {
      onAuthorize?.(provider, configuration);
      const authTask = authInfoService.login(provider.id, {
        configurationId: configuration.id,
      });
      setAuthTask(authTask);

      const user = await authTask;

      if (user) {
        onClose?.();
      }

      setAuthTask(null);
    } catch (exception: any) {
      notificationService.logException(exception, 'Federated authentication error');
    } finally {
      onAuthorize?.(null, null);
    }
  }

  function navToSettings() {
    onClose?.();
    authenticationService.configureIdentityProvider?.();
  }

  if (configurations.length === 0) {
    return (
      <TextPlaceholder>
        {translate('authentication_configure')}
        {authenticationService.configureIdentityProvider && (
          <Link onClick={navToSettings}>
            {translate('ui_configure')}
          </Link>
        )}
      </TextPlaceholder>
    );
  }

  if (activeProvider && activeConfiguration) {
    return styled(style)(
      <container className={className}>
        <Loader
          state={authTaskState}
          style={loaderStyle}
          message="authentication_authorizing"
          hideException
        >
          <center>
            <Button
              type="button"
              mod={['unelevated']}
              onClick={() => auth({ provider: activeProvider, configuration: activeConfiguration })}
            >
              <Translate token='authentication_login' />
            </Button>
          </center>
        </Loader>
      </container>
    );
  }

  return styled(style)(
    <container className={className}>
      {configurations.length >= 10 && (
        <Filter
          placeholder={translate('authentication_identity_provider_search_placeholder')}
          value={search}
          max
          onFilter={setSearch}
        />
      )}
      <list>
        {filteredConfigurations.map(({ provider, configuration }) => {
          const icon = configuration.iconURL || provider.icon;
          const title = `${configuration.displayName}\n${configuration.description || ''}`;
          return (
            <Link
              key={configuration.id}
              title={title}
              wrapper
              onClick={() => auth({ provider, configuration })}
            >
              <Cell
                before={icon ? <IconOrImage icon={icon} /> : undefined}
                description={configuration.description}
              >
                {configuration.displayName}
              </Cell>
            </Link>
          );
        })}
      </list>
      <Loader
        state={authTaskState}
        style={loaderStyle}
        message="authentication_authorizing"
        overlay
        hideException
      />
    </container>
  );
});
