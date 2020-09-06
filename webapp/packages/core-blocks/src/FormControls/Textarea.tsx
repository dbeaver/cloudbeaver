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

import { useStyles } from '@cloudbeaver/core-theming';

import { baseFormControlStyles } from './baseFormControlStyles';
import { FormContext } from './FormContext';

const styles = css`
  textarea {
    line-height: 19px;
  }
`;

type BaseProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> & {
  mod?: 'surface';
  long?: boolean;
}

type ControlledProps = BaseProps & {
  name?: string;
  value?: string;
  onChange?(value: string, name?: string): any;

  state?: never;
}

type ObjectProps<TKey extends keyof TState, TState> = BaseProps & {
  name: TKey;
  state: TState;
  onChange?(value: string, name: TKey): any;

  value?: never;
}

type TextareaType = {
  (props: ControlledProps): JSX.Element;
  <TKey extends keyof TState, TState>(props: ObjectProps<TKey, TState>): JSX.Element;
}

export const Textarea: TextareaType = observer(function Textarea({
  name,
  value: controlledValue,
  state,
  children,
  className,
  mod,
  long,
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

  return styled(useStyles(baseFormControlStyles, styles))(
    <field as="div" className={className} {...use({ long })}>
      <field-label as='label'>{children}</field-label>
      <textarea
        {...rest}
        value={value}
        name={name}
        onChange={handleChange}
        {...use({ mod })}
      />
    </field>
  );
});
