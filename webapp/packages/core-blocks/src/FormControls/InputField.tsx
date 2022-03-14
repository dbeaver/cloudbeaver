/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useContext, useState } from 'react';
import styled, { use, css } from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-localization';
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps';
import { Icon } from '../Icon';
import { baseFormControlStyles, baseInvalidFormControlStyles, baseValidFormControlStyles } from './baseFormControlStyles';
import { FormContext } from './FormContext';
import { isControlPresented } from './isControlPresented';

const INPUT_FIELD_STYLES = css`
    Icon {
      composes: theme-text-on-secondary from global;
    }
    field-label {
      display: block;
      composes: theme-typography--body1 from global;
      font-weight: 500;
    }
    field-label:not(:empty) {
      padding-bottom: 10px;
    }
    input-container {
      position: relative;
    }
    icon-container {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      width: 24px;
      height: 24px;
      cursor: pointer;
      & Icon {
        width: 100%;
        height: 100%;
      }
    }
    input[disabled] + icon-container {
      cursor: auto;
      opacity: 0.8;
    }
    input:not(:only-child) {
      padding-right: 32px !important;
    }
`;

type BaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'name' | 'value' | 'style'> & ILayoutSizeProps & {
  error?: boolean;
  description?: string;
  labelTooltip?: string;
  mod?: 'surface';
  ref?: React.Ref<HTMLInputElement>;
  style?: ComponentStyle;
  onCustomCopy?: () => void;
};

type ControlledProps = BaseProps & {
  name?: string;
  value?: string | number;
  mapState?: (value: string | number) => string | number;
  mapValue?: (value: string | number) => string | number;
  onChange?: (value: string | number, name?: string) => any;
  state?: never;
  autoHide?: never;
};

type ObjectProps<TKey extends keyof TState, TState> = BaseProps & {
  name: TKey;
  state: TState;
  mapState?: (value: TState[TKey]) => TState[TKey] | string | number;
  mapValue?: (value: TState[TKey]) => TState[TKey];
  onChange?: (value: TState[TKey], name: TKey) => any;
  autoHide?: boolean;
  value?: never;
};

interface InputFieldType {
  (props: ControlledProps): React.ReactElement<any, any> | null;
  <TKey extends keyof TState, TState>(props: ObjectProps<TKey, TState>): React.ReactElement<any, any> | null;
}

export const InputField: InputFieldType = observer(function InputField({
  name,
  style,
  value: valueControlled,
  defaultValue,
  required,
  state,
  mapState,
  mapValue,
  children,
  className,
  error,
  description,
  labelTooltip,
  mod,
  fill,
  small,
  medium,
  large,
  tiny,
  autoHide,
  onChange,
  onCustomCopy,
  ...rest
}: ControlledProps | ObjectProps<any, any>, ref: React.Ref<HTMLInputElement>) {
  const [passwordRevealed, setPasswordRevealed] = useState(false);
  const translate = useTranslate();
  const styles = useStyles(
    baseFormControlStyles,
    error ? baseInvalidFormControlStyles : baseValidFormControlStyles,
    INPUT_FIELD_STYLES,
    style
  );
  const context = useContext(FormContext);

  const revealPassword = useCallback(() => {
    if (rest.disabled) {
      return;
    }

    setPasswordRevealed(prev => !prev);
  }, [rest.disabled]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = mapValue?.(event.target.value) ?? event.target.value;

    if (state) {
      state[name] = value;
    }
    if (onChange) {
      onChange(value, name);
    }
    if (context) {
      context.change(value, name);
    }
  }, [state, name, context, onChange]);

  if (autoHide && !isControlPresented(name, state, defaultValue)) {
    return null;
  }

  let value: any = valueControlled ?? defaultValue ?? undefined;

  if (state && name !== undefined && name in state) {
    value = state[name];
  }

  if (mapState) {
    value = mapState(value);
  }

  const showRevealPasswordButton = rest.type === 'password' && !rest.readOnly;

  return styled(styles)(
    <field className={className} {...use({ small, medium, large, tiny })}>
      <field-label title={labelTooltip || rest.title}>{children}{required && ' *'}</field-label>
      <input-container>
        <input
          ref={ref}
          {...rest}
          type={passwordRevealed ? 'text' : rest.type}
          name={name}
          value={value ?? ''}
          onChange={handleChange}
          {...use({ mod })}
          required={required}
        />
        {showRevealPasswordButton && (
          <icon-container
            title={translate('ui_reveal_password')}
            onClick={revealPassword}
          >
            <Icon
              name={passwordRevealed ? 'password-hide' : 'password-show'}
              viewBox='0 0 16 16'
            />
          </icon-container>
        )}
        {onCustomCopy && (
          <icon-container title={translate('ui_copy_to_clipboard')} onClick={onCustomCopy}>
            <Icon name="copy" viewBox='0 0 32 32' />
          </icon-container>
        )}
      </input-container>
      {description && (
        <field-description>
          {description}
        </field-description>
      )}
    </field>
  );
}, { forwardRef: true });
