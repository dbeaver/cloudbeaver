/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useState } from 'react';
import styled, { css, use } from 'reshadow';

import { composes, useStyles } from '@cloudbeaver/core-theming';

import { IconButton } from '../IconButton';
import { useFocus } from '../useFocus';
import { InputFieldNew } from './InputFieldNew';

const styles = css`
  filter-container {
    position: relative;
    min-width: 24px;
    min-height: 24px;
  }
  InputFieldNew {
    display: none;
    width: 300px;
    &[|toggled] {
      display: block;
    }
  }
  IconButton {
    position: absolute;
    right: 2px;
    top: 2px;
    margin: 0;
    width: 24px;
    height: 24px;
    border-radius: 2px;
    cursor: auto;
    &[|toggled] {
      border-radius: unset;
    }
  }
`;

const toggleModeButtonStyle = composes(
  css`
    IconButton {
      composes: theme-background-primary theme-text-on-primary from global;
    }
  `,
  css`
    IconButton {
      cursor: pointer;
    }
`);

const innerInputStyle = css`
  input {
    height: 28px;
    padding-right: 24px !important;
  }
`;

interface BaseProps {
  toggleMode?: boolean;
  onToggle?: (status: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
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
  onFilter?: (value: TState[TKey], name: TKey) => void;
  value?: never;
};

export const Filter: React.FC<ControlledProps | ObjectsProps<any, any>> = observer(function Filter({
  state,
  name,
  value: valueControlled,
  onFilter,
  toggleMode,
  onToggle,
  placeholder,
  disabled,
  className,
}) {
  const [inputRef] = useFocus<HTMLInputElement>({});
  const [toggled, setToggled] = useState(!toggleMode);

  const filter = useCallback((value: string | number, name?: string) => {
    value = String(value).trim();

    if (state && name) {
      state[name] = value;
    }

    if (onFilter) {
      onFilter(value, name);
    }
  }, [onFilter, state]);

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

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.keyCode === 13) {
      event.stopPropagation();
    }
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
    event.stopPropagation();
  };

  const preventPropagation = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
  };

  useEffect(() => {
    if (toggled && toggleMode) {
      inputRef.current?.focus();
    }
  }, [toggled, toggleMode, inputRef]);

  let value: any = valueControlled;

  if (state && name !== undefined && name in state) {
    value = state[name];
  }

  return styled(useStyles(styles, toggleMode && toggleModeButtonStyle))(
    <filter-container
      as='div'
      className={className}
      onClick={handleClick}
      onDoubleClick={preventPropagation}
    >
      <InputFieldNew
        ref={inputRef}
        style={innerInputStyle}
        placeholder={placeholder}
        disabled={disabled}
        name={name}
        value={value}
        onKeyDown={onKeyDown}
        onChange={filter}
        {...use({ toggled })}
      />
      <IconButton
        name='search'
        disabled={disabled}
        onClick={toggle}
        {...use({ toggled })}
      />
    </filter-container>
  );
});
