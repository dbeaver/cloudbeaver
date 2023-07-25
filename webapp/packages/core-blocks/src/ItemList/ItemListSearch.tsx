/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useCallback, useRef, useState } from 'react';
import { use } from 'reshadow';

import { IconButton } from '../IconButton';
import { useTranslate } from '../localization/useTranslate';
import { s } from '../s';
import { useS } from '../useS';
import style from './ItemList.m.css';

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
  const styles = useS(style);
  const [search, setSearch] = useState(value ?? '');
  const translate = useTranslate();
  const changeHandler = useCallback(
    (changeValue: string) => {
      if (value === undefined) {
        setSearch(changeValue);
      }
      if (onChange) {
        onChange(changeValue);
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

  const inputValue = value ?? search;

  return (
    <div className={s(styles, { listSearch: true })}>
      <div className={s(styles, { inputBox: true })}>
        <input
          ref={inputRef}
          name="search"
          className={s(styles, { input: true }, className)}
          placeholder={translate(placeholder || 'ui_search')}
          value={inputValue}
          autoComplete="off"
          disabled={disabled}
          onChange={event => changeHandler(event.target.value)}
          {...use({ mod: 'surface' })}
        />
        <div className={s(styles, { actionButton: true })}>
          {!onSearch && inputValue ? (
            <IconButton className={s(styles, { iconButton: true, crossIcon: true })} name="cross" onClick={() => changeHandler('')} />
          ) : (
            <IconButton className={s(styles, { iconButton: true })} name="search" onClick={searchHandler} />
          )}
        </div>
      </div>
    </div>
  );
};
