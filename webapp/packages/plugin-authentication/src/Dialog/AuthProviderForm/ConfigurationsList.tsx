/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useState, useMemo } from 'react';
import styled, { css } from 'reshadow';

import { comparePublicAuthConfigurations } from '@cloudbeaver/core-authentication';
import { Filter, IconOrImage, Link, Cell } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { AuthProviderConfiguration } from '@cloudbeaver/core-sdk';
import { composes, useStyles } from '@cloudbeaver/core-theming';

interface Props {
  configurations: AuthProviderConfiguration[];
  providerIcon?: string;
  className?: string;
}

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
      margin-bottom: 12px;
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

export const ConfigurationsList = observer<Props>(function ConfigurationsList({ configurations, providerIcon, className }) {
  const translate = useTranslate();

  const [search, setSearch] = useState('');

  const filteredConfigurations = useMemo(() => computed(() => {
    const sortedConfigurations = configurations.slice().sort(comparePublicAuthConfigurations);
    if (!search) {
      return sortedConfigurations;
    }

    return sortedConfigurations.filter(configuration => {
      const target = `${configuration.displayName}${configuration.description || ''}`;
      return target.toUpperCase().includes(search.toUpperCase());
    });
  }), [search, configurations]);

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
        {filteredConfigurations.get().map(configuration => {
          const icon = configuration.iconURL || providerIcon;
          const title = `${configuration.displayName}\n${configuration.description || ''}`;
          return (
            <Link key={configuration.id} href={configuration.signInLink} title={title} wrapper>
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
