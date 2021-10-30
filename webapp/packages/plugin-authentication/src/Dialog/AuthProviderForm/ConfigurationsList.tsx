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
  provider: AuthProvider;
  onClose?: () => void;
  className?: string;
}

export const ConfigurationsList = observer<Props>(function ConfigurationsList({ provider, onClose, className }) {
  const authInfoService = useService(AuthInfoService);
  const translate = useTranslate();

  const [search, setSearch] = useState('');
  const configurations = getComputed(() =>
    (provider.configurations || [])
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

  async function auth(configuration: AuthProviderConfiguration) {
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
          const icon = configuration.iconURL || provider.icon;
          const title = `${configuration.displayName}\n${configuration.description || ''}`;
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
