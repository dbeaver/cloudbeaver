/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useState, useMemo } from 'react';
import styled, { css, use } from 'reshadow';

import { DBDriver, DBSource } from '@dbeaver/core/app';
import { StaticImage } from '@dbeaver/core/blocks';
import { useTranslate } from '@dbeaver/core/localization';
import { useStyles, composes } from '@dbeaver/core/theming';

import { DBSourceItem } from './DBSourceItem';

const styles = composes(
  css`
    list-item {
      composes: theme-ripple theme-background-surface theme-border-color-secondary from global;
    }
    list-search {
      composes: theme-background-secondary from global;
    }
  `,
  css`
    list {
      box-sizing: border-box;
      border-collapse: collapse;
    }
    list-item {
      border-bottom: 1px solid;
    }
    list-search {
      position: sticky;
      top: 0;
      padding: 8px 24px;
      z-index: 1;

      & input {
        padding: 4px 24px;
        padding-left: 32px;
      }

      & StaticImage {
        position: absolute;
        top: 15px;
        left: 32px;
      }
    }
  `
);

type DBSourceSelectorProps = {
  dbSources: DBSource[];
  dbDrivers: Map<string, DBDriver>;
  className?: string;
  onSelect(dbSourceId: string): void;
}

export const DBSourceSelector = observer(function DBSourceSelector({
  dbSources,
  dbDrivers,
  className,
  onSelect,
}: DBSourceSelectorProps) {
  const [search, setSearch] = useState('');
  const translate = useTranslate();
  const filteredDBSources = useMemo(() => {
    if (!search) {
      return dbSources;
    }
    return dbSources.filter(source => source.name.toUpperCase().includes(search.toUpperCase()));
  }, [search, dbSources]);

  return styled(useStyles(styles))(
    <list as="div" className={className}>
      <list-search as="div">
        <StaticImage icon='/icons/search.svg' />
        <input
          name='search'
          placeholder={translate('ui_search')}
          onChange={event => setSearch(event.target.value)}
          {...use({ mod: 'surface' })}
        />
      </list-search>
      {filteredDBSources.map(dbSource => (
        <list-item as="div" key={dbSource.id}>
          <DBSourceItem
            dbSource={dbSource}
            dbDriver={dbDrivers.get(dbSource.driverId)}
            onSelect={onSelect}
          />
        </list-item>
      ))}
    </list>
  );
});
