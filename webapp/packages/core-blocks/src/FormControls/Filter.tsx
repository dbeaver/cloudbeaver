/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { type HTMLAttributes, useState } from 'react';

import { isNotNullDefined } from '@dbeaver/js-helpers';

import { ActionIconButton } from '../ActionIconButton.js';
import { Container } from '../Containers/Container.js';
import type { IContainerProps } from '../Containers/IContainerProps.js';
import { s } from '../s.js';
import { useFocus } from '../useFocus.js';
import { useS } from '../useS.js';
import filterStyle from './Filter.module.css';
import { InputField } from './InputField/InputField.js';

interface BaseProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'>, IContainerProps {
  placeholder?: string;
  disabled?: boolean;
  disabledActions?: boolean;
  permanentSearchIcon?: boolean;
  smallSize?: boolean;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
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
  disabledActions,
  className,
  permanentSearchIcon,
  smallSize,
  onSearch,
  onChange,
  ...rest
}) {
  const styles = useS(filterStyle);
  const [inputRef] = useFocus<HTMLInputElement>({});

  let valuePassedFromProps = isNotNullDefined(valueControlled);
  let value: any = valueControlled;

  if (state && name !== undefined && name in state) {
    value = state[name];
    valuePassedFromProps = true;
  }

  value = String(value ?? '');

  const [search, setSearch] = useState(value);

  if (!valuePassedFromProps) {
    value = search;
  }

  function handleChange(value: string | number) {
    value = String(value);

    if (state && name) {
      state[name] = value;
    }

    if (onChange) {
      onChange(value, name);
    }

    setSearch(value);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && !disabledActions && !disabled) {
      onSearch?.(value);
    }
  }

  function handleClear() {
    handleChange('');
    onSearch?.('');
  }

  function searchHandler() {
    onSearch?.(value);
  }

  const edited = !!String(value);

  return (
    <Container {...rest} className={s(styles, { filterContainer: true, smallSize }, className)}>
      <InputField
        ref={inputRef}
        type="search"
        autoComplete="off"
        className={s(styles, { inputField: true })}
        placeholder={placeholder}
        readOnly={disabled}
        name={name}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />

      <div className={s(styles, { actionButtons: true })}>
        {edited && !permanentSearchIcon ? (
          <ActionIconButton name="cross" disabled={disabled || disabledActions} className={s(styles, { actionButton: true })} onClick={handleClear} />
        ) : (
          <ActionIconButton
            name="search"
            viewBox="4 4 16 16"
            disabled={disabled || disabledActions}
            className={s(styles, { actionButton: true })}
            onClick={searchHandler}
          />
        )}
      </div>
    </Container>
  );
});
