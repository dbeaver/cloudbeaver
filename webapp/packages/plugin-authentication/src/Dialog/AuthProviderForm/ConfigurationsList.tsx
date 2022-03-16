/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styled, { css } from 'reshadow';

import { AuthInfoService, AuthProvider, comparePublicAuthConfigurations } from '@cloudbeaver/core-authentication';
import { Filter, IconOrImage, Link, Cell, getComputed, TextPlaceholder } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { AuthProviderConfiguration } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { AuthenticationService } from '../../AuthenticationService';

const styles = css`
    container {
      display: flex;
      flex-direction: column;
      overflow: auto;
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
`;

interface IProviderConfiguration {
  provider: AuthProvider;
  configuration: AuthProviderConfiguration;
}

interface Props {
  providers: AuthProvider[];
  onClose?: () => void;
  className?: string;
}

export const ConfigurationsList = observer<Props>(function ConfigurationsList({ providers, onClose, className }) {
  const authInfoService = useService(AuthInfoService);
  const authenticationService = useService(AuthenticationService);
  const translate = useTranslate();
  const style = useStyles(styles);

  const [search, setSearch] = useState('');
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
    filteredConfigurations =  sortedConfigurations;
  }

  filteredConfigurations =  sortedConfigurations.filter(({ configuration }) => {
    const target = `${configuration.displayName}${configuration.description || ''}`;
    return target.toUpperCase().includes(search.toUpperCase());
  });

  async function auth({ provider, configuration }: IProviderConfiguration) {
    const user = await authInfoService.sso(provider.id, configuration);

    if (user) {
      onClose?.();
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
    </container>
  );
});
