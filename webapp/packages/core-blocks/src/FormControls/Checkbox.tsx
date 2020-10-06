/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback, useContext } from 'react';
import styled, { css, use } from 'reshadow';

import { composes, useStyles } from '@cloudbeaver/core-theming';

import { baseFormControlStyles } from './baseFormControlStyles';
import { FormContext } from './FormContext';

const checkboxStyles = composes(
  css`
  checkbox {
    composes: theme-checkbox from global;
  }
  checkbox-input {
    composes: theme-checkbox_native-control from global;
  }
  checkbox-background {
    composes: theme-checkbox__background from global;
  }
  checkbox-checkmark {
    composes: theme-checkbox__checkmark from global;
  }
  checkbox-checkmark-path {
    composes: theme-checkbox__checkmark-path from global;
  }
  checkbox-mixedmark {
    composes: theme-checkbox__mixedmark from global;
  }
  checkbox-ripple {
    composes: theme-checkbox__ripple from global;
  }
  `,
  css`
    field {
      padding: unset;
      min-height: 40px;
      margin-right: -11px;
    }
  `
);

const checkboxMod = {
  primary: composes(
    css`
      checkbox {
        composes: theme-checkbox_primary from global;
      }
    `
  ),
};

const checkboxState = {
  disabled: composes(
    css`
      checkbox {
        composes: theme-checkbox--disabled from global;
      }
    `
  ),
  checked: composes(
    css`
      checkbox {
        composes: theme-checkbox--checked from global;
      }
    `
  ),
};


type BaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'value' | 'checked'> & {
  value?: string;
  checkboxLabel?: string;
  mod?: 'surface';
  long?: boolean;
}

type ControlledProps = BaseProps & {
  checked?: boolean;
  indeterminate?: boolean;
  onChange?(value: boolean, name?: string): any;
  state?: never;
}

type ObjectProps<TKey extends keyof TState, TState> = BaseProps & {
  name: TKey;
  state: TState;
  onChange?(value: boolean, name: TKey): any;
  checked?: never;
  indeterminate?: boolean;
}

type CheckboxType = {
  (props: ControlledProps): JSX.Element;
  <TKey extends keyof TState, TState>(props: ObjectProps<TKey, TState>): JSX.Element;
}

export const Checkbox: CheckboxType = observer(function Checkbox({
  name,
  value,
  state,
  checkboxLabel,
  checked: checkedControlled,
  children,
  className,
  mod,
  long,
  onChange,
  disabled,
  ...rest
}: ControlledProps | ObjectProps<any, any>) {
  const context = useContext(FormContext);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (state) {
      state[name] = event.target.checked;
    }
    if (onChange) {
      onChange(event.target.checked, name);
    }
    if (context) {
      context.onChange(event.target.checked, name);
    }
  }, [state, name, onChange, context]);

  const checked = state ? state[name] : checkedControlled;

  return styled(useStyles(baseFormControlStyles, checkboxStyles, checkboxMod.primary, disabled &&
     checkboxState.disabled, checked && checkboxState.checked))(
    <field as="div" className={className}>
      <checkbox as='div'>
        <checkbox-input
          as='input'
          {...rest}
          name={name}
          id={value || name}
          type='checkbox'
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          {...use({ mod })}
        />
        <checkbox-background as='div'>
          <checkbox-checkmark as='svg' viewBox='0 0 24 24'>
            <checkbox-checkmark-path as='path' fill='none' d='M1.73,12.91 8.1,19.28 22.79,4.59' />
          </checkbox-checkmark>
          <checkbox-mixedmark as='div' />
        </checkbox-background>
        <checkbox-ripple as='div' />
      </checkbox>
      <checkbox-label as='label' htmlFor={value || name}>{checkboxLabel}</checkbox-label>
    </field>
  );
});
