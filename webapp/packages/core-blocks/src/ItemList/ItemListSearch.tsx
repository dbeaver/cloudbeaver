/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useCallback, useContext, useRef, useState } from 'react';
import styled, { use } from 'reshadow';

import { IconButton } from '../IconButton';
import { useTranslate } from '../localization/useTranslate';
import { useStyles } from '../useStyles';
import { Styles } from './styles';

interface IProps {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
}

export const ItemListSearch: React.FC<IProps> = function ItemListSearch({ value, placeholder, disabled, onChange, onSearch, className }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const styles = useContext(Styles);
  const [search, setSearch] = useState(value ?? '');
  const translate = useTranslate();
  const changeHandler = useCallback(
    (value: string) => {
      if (value === undefined) {
        setSearch(value);
      }
      if (onChange) {
        onChange(value);
      }
    },
    [value, onChange],
  );

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

  return styled(useStyles(styles || []))(
    <list-search className={className}>
      <input-box>
        <input
          ref={inputRef}
          name="search"
          placeholder={translate(placeholder || 'ui_search')}
          value={value ?? search}
          autoComplete="off"
          disabled={disabled}
          onChange={event => changeHandler(event.target.value)}
          {...use({ mod: 'surface' })}
        />
        <action-button as="div">
          {!onSearch && (value ?? search) ? (
            <IconButton name="cross" onClick={() => changeHandler('')} />
          ) : (
            <IconButton name="search" onClick={searchHandler} />
          )}
        </action-button>
      </input-box>
    </list-search>,
  );
};
