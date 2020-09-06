/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  useState, useCallback, useContext
} from 'react';
import styled, { use } from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { StaticImage } from '../StaticImage';
import { Styles } from './styles';

type Props = React.PropsWithChildren<{
  value?: string;
  placeholder?: string;
  onSearch?(value: string): void;
  className?: string;
}>

export function ItemListSearch({
  value, placeholder, onSearch, className,
}: Props) {
  const styles = useContext(Styles);
  const [search, setSearch] = useState(value ?? '');
  const translate = useTranslate();
  const searchHandler = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (value === undefined) {
      setSearch(event.target.value);
    }
    if (onSearch) {
      onSearch(event.target.value);
    }
  }, [value, onSearch]);

  return styled(useStyles(...(styles || [])))(
    <list-search as="div" className={className}>
      <StaticImage icon='/icons/search.svg' />
      <input
        name='search'
        placeholder={translate(placeholder || 'ui_search')}
        value={value ?? search}
        onChange={searchHandler}
        autoComplete="off"
        {...use({ mod: 'surface' })}
      />
    </list-search>
  );
}
