/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { forwardRef, useCallback, useContext, useLayoutEffect, useRef, useState } from 'react';

import { isNotNullDefined } from '@cloudbeaver/core-utils';

import { filterLayoutFakeProps, getLayoutProps } from '../Containers/filterLayoutFakeProps';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps';
import { Icon } from '../Icon';
import { Loader } from '../Loader/Loader';
import { useTranslate } from '../localization/useTranslate';
import { s } from '../s';
import { useCombinedHandler } from '../useCombinedHandler';
import { useCombinedRef } from '../useCombinedRef';
import { useS } from '../useS';
import { useStateDelay } from '../useStateDelay';
import { Field } from './Field';
import { FieldDescription } from './FieldDescription';
import { FieldLabel } from './FieldLabel';
import { FormContext } from './FormContext';
import inputFieldStyle from './InputField.m.css';
import { isControlPresented } from './isControlPresented';
import { useCapsLockTracker } from './useCapsLockTracker';

type BaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'name' | 'value' | 'style'> &
  ILayoutSizeProps & {
    error?: boolean;
    loading?: boolean;
    description?: string;
    labelTooltip?: string;
    ref?: React.ForwardedRef<HTMLInputElement>;
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
    const mergedRef = useCombinedRef(inputRef, ref);
    const capsLock = useCapsLockTracker();
    const [passwordRevealed, setPasswordRevealed] = useState(false);
    const translate = useTranslate();
    const layoutProps = getLayoutProps(rest);
    rest = filterLayoutFakeProps(rest);
    const styles = useS(inputFieldStyle);
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
    let uncontrolled = passwordType && !canShowPassword;

    let value: any = valueControlled ?? undefined;

    if (state && name !== undefined && name in state) {
      value = state[name];
    }

    if (mapState) {
      value = mapState(value);
    }

    if (passwordType && !rest.readOnly && capsLock.warn) {
      description = translate('ui_capslock_on');
    }

    uncontrolled ||= value === undefined;

    useLayoutEffect(() => {
      if (uncontrolled && isNotNullDefined(value) && inputRef.current) {
        inputRef.current.value = value;
      }
    });

    if (autoHide && !isControlPresented(name, state, defaultValue)) {
      return null;
    }

    return (
      <Field {...layoutProps} className={s(styles, {}, className)}>
        <FieldLabel title={labelTooltip || rest.title} className={s(styles, { fieldLabel: true })} required={required}>
          {children}
        </FieldLabel>
        <div className={s(styles, { inputContainer: true })}>
          <input
            ref={mergedRef}
            {...rest}
            type={passwordRevealed ? 'text' : rest.type}
            name={name}
            value={uncontrolled ? undefined : value ?? ''}
            defaultValue={defaultValue}
            className={s(styles, { input: true })}
            required={required}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
          {loading && (
            <div title={translate('ui_processing_loading')} className={s(styles, { loaderContainer: true })}>
              <Loader small />
            </div>
          )}
          {passwordType && canShowPassword && (
            <div title={translate('ui_reveal_password')} className={styles.iconContainer} onClick={revealPassword}>
              <Icon name={passwordRevealed ? 'password-hide' : 'password-show'} viewBox="0 0 16 16" className={styles.icon} />
            </div>
          )}
          {onCustomCopy && (
            <div title={translate('ui_copy_to_clipboard')} className={styles.iconContainer} onClick={onCustomCopy}>
              <Icon name="copy" viewBox="0 0 32 32" className={styles.icon} />
            </div>
          )}
          {icon && <div className={s(styles, { customIconContainer: true })}>{icon}</div>}
        </div>
        {(description || passwordType) && <FieldDescription invalid={error}>{description}</FieldDescription>}
      </Field>
    );
  }),
);
