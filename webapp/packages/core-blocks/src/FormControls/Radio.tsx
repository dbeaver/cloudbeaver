/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext, useCallback } from 'react';
import styled, { css, use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { FormContext } from './FormContext';
import { RadioGroupContext } from './RadioGroupContext';

const radioStyles = css`
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
    field {
      display: inline-flex;
      align-items: center;
      font-weight: 500;
      padding: 7px 12px;
      vertical-align: middle;
    }
    label {
      cursor: pointer;
      &[|disabled] {
        cursor: auto;
      }
    }
  `;

const radioMod = {
  primary: css`
      radio {
        composes: theme-radio_primary from global;
      }
    `,
  small: css`
      radio {
        composes: theme-radio_small from global;
      }
      field {
        & radio {
          width: 14px;
          height: 14px;
        }
        & radio-background {
          width: 14px;
          height: 14px;
        }
        & radio-inner-circle {
          border-width: 7px;
        }
      }
   `,
};

const noRippleStyles = css`
    radio {
      composes: theme-radio_no-ripple from global;
    }
  `;

const radioState = {
  disabled: css`
      radio {
        composes: theme-radio--disabled from global;
      }
      input {
        opacity: 0 !important;
      }
    `,
};

type BaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'checked'> & {
  mod?: Array<keyof typeof radioMod>;
  ripple?: boolean;
};

type ControlledProps = BaseProps & {
  value?: string | number;
  checked?: boolean;
  onChange?: (value: string | number, name: string) => any;
  state?: never;
};

type ObjectProps<TKey extends keyof TState, TState> = BaseProps & {
  name: TKey;
  value: TState[TKey];
  state: TState;
  onChange?: (value: TState[TKey], name: TKey) => any;
  checked?: never;
};

interface RadioType {
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
  ripple = true,
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
      formContext.change(value, name);
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

  return styled(useStyles(
    radioStyles,
    ...(mod || []).map(mod => radioMod[mod]),
    !ripple && noRippleStyles,
    rest.disabled && radioState.disabled
  ))(
    <field className={className}>
      <radio>
        <input
          {...rest}
          type="radio"
          id={id}
          name={name}
          value={value ?? ''}
          checked={checked}
          onChange={handleChange}
        />
        <radio-background>
          <radio-outer-circle />
          <radio-inner-circle />
        </radio-background>
        {ripple && <radio-ripple />}
      </radio>
      <label {...use({ disabled: rest.disabled })} htmlFor={id}>{children}</label>
    </field>
  );
});
