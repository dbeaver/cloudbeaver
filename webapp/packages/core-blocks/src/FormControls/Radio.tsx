/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useContext, useCallback } from 'react';
import styled, { css } from 'reshadow';

import { useStyles, composes } from '@cloudbeaver/core-theming';

import { FormContext } from './FormContext';
import { RadioGroupContext } from './RadioGroupContext';

const radioStyles = composes(
  css`
  radio {
    composes: theme-radio from global;
  }
  radio-background {
    composes: theme-radio_background from global;
  }
  input {
    composes: theme-radio_native-control from global;
  }
  radio-outer-circle {
    composes: theme-radio_outer-circle from global;
  }
  radio-inner-circle {
    composes: theme-radio_inner-circle from global;
  }
  radio-ripple {
    composes: theme-radio_ripple from global;
  }
  `,
  css`
    field {
      display: inline-flex;
      align-items: center;
      font-weight: 500;
      padding: 7px 12px;
      vertical-align: middle;
    }
  `
);

const radioMod = {
  primary: composes(
    css`
      radio {
        composes: theme-radio_primary from global;
      }
    `
  ),
};

type BaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'checked'> & {
  mod?: (keyof typeof radioMod)[];
}

type ControlledProps = BaseProps & {
  value?: string | number;
  checked?: boolean;
  onChange?(value: string | number, name: string): any;

  state?: never;
}

type ObjectProps<TKey extends keyof TState, TState> = BaseProps & {
  name: TKey;
  value: TState[TKey];
  state: TState;
  onChange?(value: TState[TKey], name: TKey): any;

  checked?: never;
}

type RadioType = {
  (props: ControlledProps): JSX.Element;
  <TKey extends keyof TState, TState>(props: ObjectProps<TKey, TState>): JSX.Element;
}

export const Radio: RadioType = observer(function Radio({
  name: controlledName,
  value,
  state,
  id: controlledId,
  checked: controlledChecked,
  onChange,
  mod,
  className,
  children,
  ...rest
}: ControlledProps | ObjectProps<any, any>) {
  const formContext = useContext(FormContext);
  const context = useContext(RadioGroupContext);

  const name = context?.name || controlledName;

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.checked) {
      return;
    }

    if (state) {
      state[name] = value;
    }

    if (context) {
      context.onChange(value);
    } else if (formContext) {
      formContext.onChange(value, name);
    }

    if (onChange) {
      onChange(value, name);
    }
  }, [value, context, state, name, formContext, onChange]);

  const id = controlledId ?? `${name}_${value}`;
  let checked = controlledChecked;

  if (context) {
    checked = context.value === value;
  }

  if (state) {
    checked = state[name] === value;
  }

  return styled(useStyles(radioStyles, ...(mod || []).map(mod => radioMod[mod])))(
    <field as="div" className={className}>
      <radio as="div">
        <input
          {...rest}
          type="radio"
          id={id}
          name={name}
          value={value}
          checked={checked}
          onChange={handleChange}
        />
        <radio-background as="div">
          <radio-outer-circle as="div"/>
          <radio-inner-circle as="div"/>
        </radio-background>
        <radio-ripple as="div"/>
      </radio>
      <label htmlFor={id}>{children}</label>
    </field>
  );
});
