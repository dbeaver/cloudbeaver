/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import { IconButton } from '../IconButton';
import { s } from '../s';
import { useFocus } from '../useFocus';
import { useS } from '../useS';
import filterStyle from './Filter.m.css';
import { InputField } from './InputField';

interface BaseProps {
  placeholder?: string;
  disabled?: boolean;
  disableActions?: boolean;
  applyDisabled?: boolean;
  max?: boolean;
  className?: string;
  onApply?: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

type ControlledProps = BaseProps & {
  name?: string;
  value?: string;
  state?: never;
  onChange?: (value: string, name?: string) => void;
};

type ObjectsProps<TKey extends keyof TState, TState> = BaseProps & {
  name: TKey;
  state: TState;
  value?: never;
  onChange?: (value: TState[TKey], name: TKey) => void;
};

export const Filter = observer<ControlledProps | ObjectsProps<any, any>>(function Filter({
  state,
  name,
  value: valueControlled,
  placeholder,
  disabled,
  disableActions,
  applyDisabled,
  max,
  className,
  onApply,
  onChange,
  onKeyDown,
  onClick,
}) {
  const styles = useS(filterStyle);
  const [inputRef] = useFocus<HTMLInputElement>({});

  const filter = useCallback(
    (value: string | number, name?: string) => {
      value = String(value);

      if (state && name) {
        state[name] = value;
      }

      if (onChange) {
        onChange(value, name);
      }
    },
    [onChange, state],
  );

  let value: any = valueControlled;

  if (state && name !== undefined && name in state) {
    value = state[name];
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && onApply && !applyDisabled) {
      onApply(value);
    }

    onKeyDown?.(event);
  }

  function clean() {
    filter('', name);

    if (onApply) {
      onApply('');
    }
  }

  const manualMode = !!onApply;
  const edited = !!String(value);

  return (
    <div className={s(styles, { filterContainer: true }, className)} onClick={onClick}>
      <InputField
        ref={inputRef}
        className={s(styles, { inputField: true, max })}
        placeholder={placeholder}
        disabled={disabled}
        name={name}
        value={value}
        onChange={filter}
        onKeyDown={handleKeyDown}
      />

      {edited && (
        <IconButton
          className={s(styles, { iconButton: true, cross: true, manualMode })}
          name="cross"
          disabled={disabled || disableActions}
          onClick={clean}
        />
      )}

      {(!edited || manualMode) && (
        <IconButton
          className={s(styles, { iconButton: true, manualMode })}
          name="search"
          disabled={disabled || applyDisabled || disableActions}
          onClick={onApply ? () => onApply(value) : undefined}
        />
      )}
    </div>
  );
});
