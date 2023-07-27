/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef, useCallback, useContext, useState } from 'react';
import styled, { use } from 'reshadow';

import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { getLayoutProps } from '../Containers/filterLayoutFakeProps';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps';
import elementsSizeStyles from '../Containers/shared/ElementsSize.m.css';
import { Icon } from '../Icon';
import { Loader } from '../Loader/Loader';
import { useTranslate } from '../localization/useTranslate';
import { s } from '../s';
import { useCombinedHandler } from '../useCombinedHandler';
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

export const InputField: InputFieldType = observer(
  forwardRef(function InputField(
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
      onChange,
      onCustomCopy,
      ...rest
    }: ControlledProps | ObjectProps<any, any>,
    ref: React.Ref<HTMLInputElement>,
  ) {
    const capsLock = useCapsLockTracker();
    const [passwordRevealed, setPasswordRevealed] = useState(false);
    const translate = useTranslate();
    const layoutProps = getLayoutProps(rest);
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

    if (showRevealPasswordButton && capsLock.warn) {
      description = translate('ui_capslock_on');
    }

    return styled(propStyles)(
      <div data-testid="field" className={s(styles, { ...layoutProps, field: true }, className)}>
        <div data-testid="field-label" title={labelTooltip || rest.title} className={styles.fieldLabel}>
          {children}
          {required && ' *'}
        </div>
        <div data-testid="input-container" className={styles.inputContainer}>
          <input
            ref={ref}
            {...rest}
            type={passwordRevealed ? 'text' : rest.type}
            name={name}
            value={value ?? ''}
            className={styles.input}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            {...use({ mod })}
            required={required}
          />
          {loading && (
            <div data-testid="loader-container" title={translate('ui_processing_loading')} className={styles.loaderContainer}>
              <Loader small />
            </div>
          )}
          {showRevealPasswordButton && (
            <div data-testid="icon-container" title={translate('ui_reveal_password')} className={styles.iconContainer} onClick={revealPassword}>
              <Icon name={passwordRevealed ? 'password-hide' : 'password-show'} viewBox="0 0 16 16" className={styles.icon} />
            </div>
          )}
          {onCustomCopy && (
            <div data-testid="icon-container" title={translate('ui_copy_to_clipboard')} className={styles.iconContainer} onClick={onCustomCopy}>
              <Icon name="copy" viewBox="0 0 32 32" className={styles.icon} />
            </div>
          )}
        </div>
        {(description || showRevealPasswordButton) && (
          <div data-testid="field-description" className={s(styles, { fieldDescription: true, valid: !error, invalid: error })}>
            {description}
          </div>
        )}
      </div>,
    );
  }),
);
