/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useContext } from 'react';
import styled, { use, css } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import type { ILayoutSizeProps } from '../Containers/ILayoutContainerProps';
import { baseFormControlStylesNew } from './baseFormControlStylesNew';
import { FormContext } from './FormContext';
import { isControlPresented } from './isControlPresented';

const INPUT_FIELD_STYLES = css`
  field-label {
    display: block;
    padding-bottom: 5px;
  }
`;

type BaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'name' | 'value'> & ILayoutSizeProps & {
  description?: string;
  mod?: 'surface';
};

type ControlledProps = BaseProps & {
  name?: string;
  value?: string;
  onChange?: (value: string, name?: string) => any;
  state?: never;
  autoHide?: never;
};

type ObjectProps<TKey extends keyof TState, TState> = BaseProps & {
  name: TKey;
  state: TState;
  onChange?: (value: string, name: TKey) => any;
  autoHide?: boolean;
  value?: never;
};

interface InputFieldType {
  (props: ControlledProps): React.ReactElement<any, any> | null;
  <TKey extends keyof TState, TState>(props: ObjectProps<TKey, TState>): React.ReactElement<any, any> | null;
}

export const InputFieldNew: InputFieldType = observer(function InputFieldNew({
  name,
  value: valueControlled,
  required,
  state,
  children,
  className,
  description,
  mod,
  small,
  medium,
  large,
  autoHide,
  onChange,
  ...rest
}: ControlledProps | ObjectProps<any, any>) {
  const styles = useStyles(baseFormControlStylesNew, INPUT_FIELD_STYLES);
  const context = useContext(FormContext);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (state) {
      state[name] = event.target.value;
    }
    if (onChange) {
      onChange(event.target.value, name);
    }
    if (context) {
      context.onChange(event.target.value, name);
    }
  }, [state, name, context, onChange]);

  const value = state ? state[name] : valueControlled;

  if (autoHide && !isControlPresented(name, state)) {
    return null;
  }

  return styled(styles)(
    <field as="div" className={className} {...use({ small, medium, large })}>
      <field-label as='label'>{children} {required && '*'}</field-label>
      <input
        role='new'
        {...rest}
        name={name}
        value={value ?? ''}
        onChange={handleChange}
        {...use({ mod })}
        required={required}
      />
      {description && (
        <field-description as='div'>
          {description}
        </field-description>
      )}
    </field>
  );
});
