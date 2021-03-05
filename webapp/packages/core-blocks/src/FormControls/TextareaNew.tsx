/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useContext } from 'react';
import styled, { css, use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import type { ILayoutSizeProps } from '../Containers/LayoutProps';
import { baseFormControlStylesNew } from './baseFormControlStylesNew';
import { FormContext } from './FormContext';

const styles = css`
  textarea {
    line-height: 19px;
  }
  field-label {
    display: block;
    padding-bottom: 10px;
    composes: theme-typography--body1 from global;
    font-weight: 500;
  }
`;

type BaseProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> & ILayoutSizeProps & {
  mod?: 'surface';
};

type ControlledProps = BaseProps & {
  name?: string;
  value?: string;
  onChange?: (value: string, name?: string) => any;
  state?: never;
};

type ObjectProps<TKey extends keyof TState, TState> = BaseProps & {
  name: TKey;
  state: TState;
  onChange?: (value: string, name: TKey) => any;
  value?: never;
};

interface TextareaType {
  (props: ControlledProps): JSX.Element;
  <TKey extends keyof TState, TState>(props: ObjectProps<TKey, TState>): JSX.Element;
}

export const TextareaNew: TextareaType = observer(function TextareaNew({
  name,
  value: controlledValue,
  state,
  children,
  className,
  small,
  medium,
  large,
  mod,
  onChange = () => {},
  ...rest
}: ControlledProps | ObjectProps<any, any>) {
  const context = useContext(FormContext);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (state) {
      state[name] = event.target.value;
    }
    if (onChange) {
      onChange(event.target.value, name);
    }
    if (context) {
      context.onChange(event.target.value, name);
    }
  }, [state, name, onChange]);

  const value = state ? state[name] : controlledValue;

  return styled(useStyles(baseFormControlStylesNew, styles))(
    <field as="div" className={className} {...use({ small, medium, large })}>
      <field-label as='label'>{children}</field-label>
      <textarea
        {...rest}
        role='new'
        value={value ?? ''}
        name={name}
        onChange={handleChange}
        {...use({ mod })}
      />
    </field>
  );
});
