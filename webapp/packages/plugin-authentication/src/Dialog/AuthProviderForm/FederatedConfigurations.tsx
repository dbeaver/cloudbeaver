/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styled, { css } from 'reshadow';

import { AuthInfoService, AuthProvider, comparePublicAuthConfigurations } from '@cloudbeaver/core-authentication';
import { Filter, IconOrImage, Link, Cell, getComputed } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { AuthProviderConfiguration } from '@cloudbeaver/core-sdk';
import { composes, useStyles } from '@cloudbeaver/core-theming';

const styles = composes(
  css`
    Cell {
      composes: theme-border-color-secondary from global;
    }
`,
  css`
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
      border-bottom: 1px solid;
      padding: 0 16px;
    }
    IconOrImage {
      width: 100%;
      height: 100%;
    }
`);

interface Props {
  providers: AuthProvider[];
  onClose?: () => void;
  className?: string;
}

export const FederatedConfigurations = observer<Props>(function FederatedConfigurations({ providers, onClose, className }) {
  const translate = useTranslate();
  const authInfoService = useService(AuthInfoService);

  const [search, setSearch] = useState('');

  const configurations = getComputed(
    () => providers.map(provider => provider.configurations || [])
      .flat()
      .filter(configuration => configuration.signInLink)
  );

  const filteredConfigurations = getComputed(() => {
    const sortedConfigurations = configurations.slice().sort(comparePublicAuthConfigurations) || [];

    if (!search) {
      return sortedConfigurations;
    }

    return sortedConfigurations.filter(configuration => {
      const target = `${configuration.displayName}${configuration.description || ''}`;
      return target.toUpperCase().includes(search.toUpperCase());
    });
  });

  function getProviderFor(configuration: AuthProviderConfiguration) {
    return providers.find(p => p.configurations?.some(c => c.id === configuration.id));
  }

  async function auth(configuration: AuthProviderConfiguration) {
    const provider = getProviderFor(configuration);
    if (!provider) {
      return;
    }

    const user = await authInfoService.sso(provider.id, configuration);

    if (user) {
      onClose?.();
    }
  }

  return styled(useStyles(styles))(
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
        {filteredConfigurations.map(configuration => {
          const provider = getProviderFor(configuration);
          const icon = configuration.iconURL || provider?.icon;
          const description = `${configuration.description ? '\n' + configuration.description : ''}${provider?.id ? '\nprovider: ' + provider.id : ''}`;
          const title = `${configuration.displayName}${description}`;
          return (
            <Link
              key={configuration.id}
              title={title}
              wrapper
              onClick={() => auth(configuration)}
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
