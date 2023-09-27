/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { forwardRef, useCallback, useContext, useLayoutEffect, useRef, useState } from 'react';

import type { ComponentStyle } from '@cloudbeaver/core-theming';
import { isNotNullDefined } from '@cloudbeaver/core-utils';

import { filterLayoutFakeProps, getLayoutProps } from '../Containers/filterLayoutFakeProps';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps';
import elementsSizeStyles from '../Containers/shared/ElementsSize.m.css';
import { Icon } from '../Icon';
import { Loader } from '../Loader/Loader';
import { useTranslate } from '../localization/useTranslate';
import { s } from '../s';
import { useCombinedHandler } from '../useCombinedHandler';
import { useMergeRefs } from '../useMergeRefs';
import { useS } from '../useS';
import { useStateDelay } from '../useStateDelay';
import { useStyles } from '../useStyles';
import { FormContext } from './FormContext';
import formControlStyles from './FormControl.m.css';
import inputFieldStyle from './InputField.m.css';
import { isControlPresented } from './isControlPresented';
import { useCapsLockTracker } from './useCapsLockTracker';

type BaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'name' | 'value' | 'style'> &
  ILayoutSizeProps & {
    error?: boolean;
    loading?: boolean;
    description?: string;
    labelTooltip?: string;
    mod?: 'surface';
    ref?: React.ForwardedRef<HTMLInputElement>;
    style?: ComponentStyle;
    canShowPassword?: boolean;
    onCustomCopy?: () => void;
    icon?: React.ReactElement;
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

export const InputField: InputFieldType = observer(
  forwardRef<HTMLInputElement>(function InputField(
    {
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
      loading,
      description,
      labelTooltip,
      mod,
      autoHide,
      canShowPassword = true,
      onChange,
      onCustomCopy,
      icon,
      ...rest
    }: ControlledProps | ObjectProps<any, any>,
    ref,
  ) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const mergedRef = useMergeRefs(inputRef, ref);
    const capsLock = useCapsLockTracker();
    const [passwordRevealed, setPasswordRevealed] = useState(false);
    const translate = useTranslate();
    const layoutProps = getLayoutProps(rest);
    rest = filterLayoutFakeProps(rest);
    const propStyles = useStyles(style);
    const styles = useS(inputFieldStyle, formControlStyles, elementsSizeStyles);
    const context = useContext(FormContext);
    loading = useStateDelay(loading ?? false, 300);

    const revealPassword = useCallback(() => {
      if (rest.disabled) {
        return;
      }

      setPasswordRevealed(prev => !prev);
    }, [rest.disabled]);

    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
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
      },
      [state, name, context, onChange],
    );

    const handleBlur = useCombinedHandler(rest.onBlur, capsLock.handleBlur);
    const handleKeyDown = useCombinedHandler(rest.onKeyDown, capsLock.handleKeyDown, context?.keyDown);

    const passwordType = rest.type === 'password';
    const uncontrolled = passwordType && !canShowPassword;

    let value: any = valueControlled ?? defaultValue ?? undefined;

    if (state && name !== undefined && name in state) {
      value = state[name];
    }

    if (mapState) {
      value = mapState(value);
    }

    if (passwordType && !rest.readOnly && capsLock.warn) {
      description = translate('ui_capslock_on');
    }

    useLayoutEffect(() => {
      if (uncontrolled && isNotNullDefined(value) && inputRef.current) {
        inputRef.current.value = value;
      }
    });

    if (autoHide && !isControlPresented(name, state, defaultValue)) {
      return null;
    }

    return (
      <div data-testid="field" className={s(styles, { ...layoutProps, field: true }, className)}>
        <div data-testid="field-label" title={labelTooltip || rest.title} className={styles.fieldLabel}>
          {children}
          {required && ' *'}
        </div>
        <div data-testid="input-container" className={styles.inputContainer}>
          <input
            ref={mergedRef}
            {...rest}
            type={passwordRevealed ? 'text' : rest.type}
            name={name}
            value={uncontrolled ? undefined : value ?? ''}
            className={styles.input}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            required={required}
          />
          {loading && (
            <div data-testid="loader-container" title={translate('ui_processing_loading')} className={styles.loaderContainer}>
              <Loader small />
            </div>
          )}
          {passwordType && canShowPassword && (
            <div data-testid="icon-container" title={translate('ui_reveal_password')} className={styles.iconContainer} onClick={revealPassword}>
              <Icon name={passwordRevealed ? 'password-hide' : 'password-show'} viewBox="0 0 16 16" className={styles.icon} />
            </div>
          )}
          {onCustomCopy && (
            <div data-testid="icon-container" title={translate('ui_copy_to_clipboard')} className={styles.iconContainer} onClick={onCustomCopy}>
              <Icon name="copy" viewBox="0 0 32 32" className={styles.icon} />
            </div>
          )}
          {icon && <div data-testid="icon-container" className={styles.customIconContainer}>{icon}</div>}
        </div>
        {(description || passwordType) && (
          <div data-testid="field-description" className={s(styles, { fieldDescription: true, invalid: error })}>
            {description}
          </div>
        )}
      </div>
    );
  }),
);
