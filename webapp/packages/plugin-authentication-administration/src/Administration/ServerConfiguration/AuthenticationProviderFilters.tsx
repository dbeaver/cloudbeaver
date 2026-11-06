/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Filter, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { Button } from '@dbeaver/ui-kit';

import styles from './AuthenticationProviders.module.css';
import type { IAuthenticationProviderList } from './useAuthenticationProviderList.js';

interface Props {
  list: IAuthenticationProviderList;
}

const FILTERS = ['all', 'active', 'available'] as const;

export const AuthenticationProviderFilters = observer<Props>(function AuthenticationProviderFilters({ list }) {
  const classes = useS(styles);
  const translate = useTranslate();

  return (
    <div className={s(classes, { toolbar: true })}>
      <Filter
        role="search"
        className={s(classes, { search: true })}
        aria-label={translate('authentication_administration_providers_search')}
        placeholder={translate('authentication_administration_providers_search')}
        value={list.query}
        keepSize
        onChange={list.setQuery}
        onKeyDownCapture={event => {
          if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      />
      <div role="group" aria-label={translate('authentication_administration_providers_filter')} className={s(classes, { filters: true })}>
        {FILTERS.map(filter => (
          <Button
            key={filter}
            type="button"
            variant="ghost"
            size="small"
            aria-pressed={list.filter === filter}
            className={s(classes, { filter: true })}
            onClick={() => list.setFilter(filter)}
          >
            {translate(`authentication_administration_providers_${filter}`)}
            <span className={s(classes, { count: true })}>{list.counts[filter]}</span>
          </Button>
        ))}
      </div>
    </div>
  );
});
