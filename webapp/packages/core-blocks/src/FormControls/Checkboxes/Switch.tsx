/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { filterLayoutFakeProps } from '../../Containers/filterLayoutFakeProps';
import { baseFormControlStyles, baseValidFormControlStyles } from '../baseFormControlStyles';
import { isControlPresented } from '../isControlPresented';
import type { ICheckboxControlledProps, ICheckboxObjectProps } from './Checkbox';
import { useCheckboxState } from './useCheckboxState';

const switchStyles = css`
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
    switch-body {
      display: flex;
      align-items: center;
    }
    switch-body {
      composes: theme-typography--body1 from global;
    }
    switch-body field-label {
      cursor: pointer;
      user-select: none;
      display: block;
      padding-left: 18px;
      min-width: 50px;
      white-space: pre-wrap;
      font-weight: 500;
    }
  `;

const switchMod = {
  primary: css`
      switch-control {
        composes: theme-switch_primary from global;
      }
    `,
  dense: css`
      switch-body {
        composes: theme-switch_dense from global;
      }
      field-label {
        composes: theme-typography--body2 from global;
      }
      switch-body field-label {
        font-weight: initial;
      }
    `,
};

const switchState = {
  disabled: css`
      switch-control {
        composes: theme-switch--disabled mdc-switch--disabled from global;
      }
    `,
  checked: css`
      switch-control {
        composes: theme-switch--checked mdc-switch--checked from global;
      }
    `,
};

interface IBaseProps {
  mod?: Array<keyof typeof switchMod>;
  description?: React.ReactNode;
}

interface SwitchType {
  (props: IBaseProps & ICheckboxControlledProps): React.ReactElement<any, any> | null;
  <TKey extends string>(props: IBaseProps & ICheckboxObjectProps<TKey>): React.ReactElement<any, any> | null;
}

export const Switch: SwitchType = observer(function Switch({
  name,
  id,
  value,
  defaultValue,
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
  rest = filterLayoutFakeProps(rest);
  const styles = useStyles(
    baseFormControlStyles,
    baseValidFormControlStyles,
    switchStyles,
    ...mod.map(mod => switchMod[mod]),
    disabled && switchState.disabled,
    checkboxState.checked && switchState.checked
  );

  if (autoHide && !isControlPresented(name, state)) {
    return null;
  }

  return styled(styles)(
    <field className={className} title={rest.title}>
      <switch-body>
        <switch-control>
          <switch-control-track />
          <switch-control-underlay>
            <switch-control-thumb />
            <switch-input
              as='input'
              {...rest}
              type="checkbox"
              id={id || value || name}
              role="switch"
              aria-checked={checkboxState.checked}
              checked={checkboxState.checked}
              disabled={disabled}
              onChange={checkboxState.change}
            />
          </switch-control-underlay>
        </switch-control>
        <field-label as="label" htmlFor={id || value || name}>{children}</field-label>
      </switch-body>
      <field-description>{description}</field-description>
    </field>
  );
});
