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

import { StaticImage } from '@dbeaver/core/blocks';
import { useTranslate } from '@dbeaver/core/localization';
import { useStyles, composes } from '@dbeaver/core/theming';

import { Driver, IDriver } from './Driver';

const styles = composes(
  css`
    list-item {
      composes: theme-ripple theme-background-surface theme-border-color-secondary from global;
    }
    list-search {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
  `,
  css`
    list {
      box-sizing: border-box;
      border-collapse: collapse;
      z-index: 0;
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

type DriverSelectorProps = {
  drivers: IDriver[];
  className?: string;
  onSelect(driverId: string): void;
}

export const DriverSelector = observer(function DriverSelector({ drivers, className, onSelect }: DriverSelectorProps) {
  const [search, setSearch] = useState('');
  const translate = useTranslate();
  const filteredDrivers = useMemo(() => {
    if (!search) {
      return drivers;
    }
    return drivers.filter(driver => driver.name?.toUpperCase().includes(search.toUpperCase()));
  }, [search, drivers]);

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
      {filteredDrivers.map(driver => (
        <list-item as="div" key={driver.id}>
          <Driver driver={driver} onSelect={onSelect}/>
        </list-item>
      ))}
    </list>
  );
});
