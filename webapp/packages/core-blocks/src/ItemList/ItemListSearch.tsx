/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  useState, useCallback, useContext, useRef
} from 'react';
import styled, { use } from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { IconButton } from '../IconButton';
import { Styles } from './styles';

interface IProps {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
}

export const ItemListSearch: React.FC<IProps> = function ItemListSearch({
  value, placeholder, disabled, onChange, onSearch, className,
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const styles = useContext(Styles);
  const [search, setSearch] = useState(value ?? '');
  const translate = useTranslate();
  const changeHandler = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (value === undefined) {
      setSearch(event.target.value);
    }
    if (onChange) {
      onChange(event.target.value);
    }
  }, [value, onChange]);

  const searchHandler = useCallback(() => {
    if (!inputRef.current) {
      return;
    }

    if (value === undefined) {
      setSearch(inputRef.current.value);
    }
    if (onSearch) {
      onSearch(inputRef.current.value);
    }
  }, [value, onSearch]);

  const ListSearchButton = IconButton;

  return styled(useStyles(styles || []))(
    <list-search className={className}>
      <input-box>
        <input
          ref={inputRef}
          name='search'
          placeholder={translate(placeholder || 'ui_search')}
          value={value ?? search}
          autoComplete="off"
          disabled={disabled}
          onChange={changeHandler}
          {...use({ mod: 'surface' })}
        />
        <search-button as='div' onClick={searchHandler}><ListSearchButton name='search' /></search-button>
      </input-box>
    </list-search>
  );
};
