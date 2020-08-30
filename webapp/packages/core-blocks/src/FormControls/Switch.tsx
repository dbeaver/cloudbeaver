/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import { useStyles, composes } from '@cloudbeaver/core-theming';

import { baseFormControlStyles } from './baseFormControlStyles';

const switchStyles = composes(
  css`
  switch-control {
    composes: theme-switch from global;
  }
  switch-control-track {
    composes: theme-switch__track from global;
  }
  switch-input {
    composes: theme-switch_native-control from global;
  }
  switch-control-underlay {
    composes: theme-switch__thumb-underlay from global;
  }
  switch-control-thumb {
    composes: theme-switch__thumb from global;
  }
  radio-ripple {
    composes: theme-radio_ripple from global;
  }
  `,
  css`
    field label {
      width: auto;
    }
  `
);

const switchMod = {
  primary: composes(
    css`
      switch-control {
        composes: theme-switch_primary from global;
      }
    `
  ),
};

const switchState = {
  disabled: composes(
    css`
      switch-control {
        composes: theme-switch--disabled from global;
      }
    `
  ),
  checked: composes(
    css`
      switch-control {
        composes: theme-switch--checked from global;
      }
    `
  ),
};

type BaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'value' | 'checked'> & {
  mod?: (keyof typeof switchMod)[];
  label?: string;
  description?: string;
}

type ControlledProps = BaseProps & {
  checked?: boolean;
  onChange?(value: boolean, name?: string): any;

  state?: never;
}

type ObjectProps<TKey extends keyof TState, TState> = BaseProps & {
  name: TKey;
  state: TState;
  onChange?(value: boolean, name: TKey): any;

  checked?: never;
}

type SwitchType = {
  (props: ControlledProps): JSX.Element;
  <TKey extends keyof TState, TState>(props: ObjectProps<TKey, TState>): JSX.Element;
}

export const Switch: SwitchType = observer(function Switch(props: ControlledProps | ObjectProps<any, any>) {
  const {
    name,
    id,
    label,
    description,
    state,
    className,
    children,
    onChange,
    mod = [],
    disabled,
    ...rest
  } = props;

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (state) {
      state[name] = event.target.checked;
    }
    if (onChange) {
      onChange(event.target.checked, name);
    }
  }, [state, name, onChange]);

  const checked = state ? state[name] : props.checked;

  return styled(useStyles(
    baseFormControlStyles,
    switchStyles,
    ...mod.map(mod => switchMod[mod]),
    disabled && switchState.disabled,
    checked && switchState.checked
  ))(
    <field as="div" className={className}>
      <field-label as="div">{children}</field-label>
      <switch-control as='div'>
        <switch-control-track as='div' />
        <switch-control-underlay as='div' >
          <switch-control-thumb as='div' />
          <switch-input
            as='input'
            {...rest}
            type="checkbox"
            id={id}
            role="switch"
            onChange={handleChange}
            aria-checked={checked}
            checked={checked}
            disabled={disabled}
          />
        </switch-control-underlay>
      </switch-control>
      <label htmlFor={id}>{label}</label>
      <field-description as='div'>{description}</field-description>
    </field>
  );
});
