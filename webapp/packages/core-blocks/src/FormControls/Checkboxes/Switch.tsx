/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { useStyles, composes } from '@cloudbeaver/core-theming';

import { baseFormControlStyles } from '../baseFormControlStyles';
import { isControlPresented } from '../isControlPresented';
import type { ICheckboxControlledProps, ICheckboxObjectProps } from './Checkbox';
import { useCheckboxState } from './useCheckboxState';

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
    field {
      max-width: 450px;
    }
    field label {
      width: auto;
    }
    switch-control {
      margin-left: 2px;
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

interface IBaseProps {
  mod?: Array<keyof typeof switchMod>;
  description?: string;
}

interface SwitchType {
  (props: IBaseProps & ICheckboxControlledProps): React.ReactElement<any, any> | null;
  <TKey extends string>(props: IBaseProps & ICheckboxObjectProps<TKey>): React.ReactElement<any, any> | null;
}

export const Switch: SwitchType = observer(function Switch({
  name,
  value,
  defaultValue,
  label,
  description,
  state,
  checked,
  defaultChecked,
  className,
  children,
  onChange,
  mod = [],
  autoHide,
  disabled,
  ...rest
}: IBaseProps & (ICheckboxControlledProps | ICheckboxObjectProps<any>)) {
  const checkboxState = useCheckboxState({
    value,
    defaultValue,
    checked,
    defaultChecked,
    state,
    name,
    onChange,
  });
  const styles = useStyles(
    baseFormControlStyles,
    switchStyles,
    ...mod.map(mod => switchMod[mod]),
    disabled && switchState.disabled,
    checkboxState.checked && switchState.checked
  );

  if (autoHide && !isControlPresented(name, state)) {
    return null;
  }

  return styled(styles)(
    <field as="div" className={className}>
      <field-label as="div">{children}</field-label>
      <switch-control as='div'>
        <switch-control-track as='div' />
        <switch-control-underlay as='div'>
          <switch-control-thumb as='div' />
          <switch-input
            as='input'
            {...rest}
            type="checkbox"
            id={value || name}
            role="switch"
            aria-checked={checkboxState.checked}
            checked={checkboxState.checked}
            disabled={disabled}
            onChange={checkboxState.change}
          />
        </switch-control-underlay>
      </switch-control>
      <label htmlFor={value || name}>{label}</label>
      <field-description as='div'>{description}</field-description>
    </field>
  );
});
