/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useContext } from 'react';
import styled, { css, use } from 'reshadow';

import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps';
import { baseFormControlStyles, baseValidFormControlStyles } from './baseFormControlStyles';
import { FormContext } from './FormContext';

const styles = css`
  textarea {
    line-height: 19px;
  }
  field[|embedded] {
    height: 100%;
    display: flex;
    flex-direction: column;
    
    & textarea {
      border-radius: 0 !important;
      height: 100%;
      resize: none !important;
    }
  }
  field-label {
    display: block;
    padding-bottom: 10px;
    composes: theme-typography--body1 from global;
    font-weight: 500;

    &:empty {
      display: none;
    }
  }
`;

type BaseProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'style'> & ILayoutSizeProps & {
  description?: string;
  labelTooltip?: string;
  mod?: 'surface';
  style?: ComponentStyle;
  embedded?: boolean;
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

export const Textarea: TextareaType = observer(function Textarea({
  name,
  style,
  value: controlledValue,
  state,
  required,
  children,
  className,
  fill,
  tiny,
  small,
  medium,
  large,
  description,
  labelTooltip,
  mod,
  embedded,
  onChange = () => { },
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
      context.change(event.target.value, name);
    }
  }, [state, name, onChange]);

  const value = state ? state[name] : controlledValue;

  return styled(useStyles(baseFormControlStyles, baseValidFormControlStyles, styles, style))(
    <field className={className} {...use({ tiny, small, medium, large, embedded })}>
      <field-label
        title={labelTooltip || rest.title}
      >
        {children}{required && ' *'}
      </field-label>
      <textarea
        {...rest}
        value={value ?? ''}
        name={name}
        data-embedded={embedded}
        onChange={handleChange}
        {...use({ mod })}
      />
      {description && (
        <field-description>
          {description}
        </field-description>
      )}
    </field>
  );
});
