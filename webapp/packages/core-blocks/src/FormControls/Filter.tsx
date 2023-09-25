/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useState } from 'react';
import styled from 'reshadow';

import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { IconButton } from '../IconButton';
import { s } from '../s';
import { useFocus } from '../useFocus';
import { useS } from '../useS';
import { useStyles } from '../useStyles';
import filterStyle from './Filter.m.css';
import { InputField } from './InputField';

interface BaseProps {
  toggleMode?: boolean;
  placeholder?: string;
  disabled?: boolean;
  max?: boolean;
  className?: string;
  style?: ComponentStyle;
  onToggle?: (status: boolean) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

type ControlledProps = BaseProps & {
  name?: string;
  value?: string;
  state?: never;
  onFilter?: (value: string, name?: string) => void;
};

type ObjectsProps<TKey extends keyof TState, TState> = BaseProps & {
  name: TKey;
  state: TState;
  value?: never;
  onFilter?: (value: TState[TKey], name: TKey) => void;
};

export const Filter = observer<ControlledProps | ObjectsProps<any, any>>(function Filter({
  state,
  name,
  value: valueControlled,
  toggleMode,
  placeholder,
  disabled,
  max,
  className,
  style: propStyle,
  onFilter,
  onToggle,
  onKeyDown,
  onClick,
}) {
  const styles = useS(filterStyle);
  const [inputRef, ref] = useFocus<HTMLInputElement>({});
  const [toggled, setToggled] = useState(!toggleMode);

  const filter = useCallback(
    (value: string | number, name?: string) => {
      value = String(value);

      if (state && name) {
        state[name] = value;
      }

      if (onFilter) {
        onFilter(value, name);
      }
    },
    [onFilter, state],
  );

  const toggle = useCallback(() => {
    if (!toggleMode) {
      return;
    }

    if (toggled) {
      filter('');
    }

    setToggled(!toggled);

    if (onToggle) {
      onToggle(!toggled);
    }
  }, [toggleMode, toggled, onToggle, filter]);

  useEffect(() => {
    if (toggled && toggleMode) {
      ref.reference?.focus();
    }
  }, [toggled, toggleMode, ref.reference]);

  let value: any = valueControlled;

  if (state && name !== undefined && name in state) {
    value = state[name];
  }

  return styled(useStyles(propStyle))(
    <div className={s(styles, { filterContainer: true })} onClick={onClick}>
      <InputField
        className={s(styles, { inputField: true, max, toggled })}
        ref={inputRef}
        style={propStyle}
        placeholder={placeholder}
        disabled={disabled}
        name={name}
        value={value}
        onChange={filter}
        onKeyDown={onKeyDown}
      />
      {String(value) ? (
        <IconButton
          className={s(styles, { iconButton: true, cross: true, toggleMode })}
          name="cross"
          disabled={disabled}
          onClick={() => filter('', name)}
        />
      ) : (
        <IconButton className={s(styles, { iconButton: true, toggled, toggleMode })} name="search" disabled={disabled} onClick={toggle} />
      )}
    </div>,
  );
});
