/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { forwardRef, useCallback, useLayoutEffect, useRef, useState } from 'react';

import { isNotNullDefined } from '@cloudbeaver/core-utils';

import { filterLayoutFakeProps, getLayoutProps } from '../../Containers/filterLayoutFakeProps';
import type { ILayoutSizeProps } from '../../Containers/ILayoutSizeProps';
import { Icon } from '../../Icon';
import { Loader } from '../../Loader/Loader';
import { useTranslate } from '../../localization/useTranslate';
import { s } from '../../s';
import { useCombinedHandler } from '../../useCombinedHandler';
import { useCombinedRef } from '../../useCombinedRef';
import { useS } from '../../useS';
import { useStateDelay } from '../../useStateDelay';
import { useValidationStyles } from '../../useValidationStyles';
import { Field } from '../Field';
import { FieldDescription } from '../FieldDescription';
import { FieldLabel } from '../FieldLabel';
import { useCapsLockTracker } from '../useCapsLockTracker';
import inputFieldStyle from './InputField.module.css';

export type InputFieldBaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'style' | 'ref'> &
  ILayoutSizeProps & {
    value?: string;
    error?: boolean;
    loading?: boolean;
    description?: string;
    labelTooltip?: string;
    canShowPassword?: boolean;
    icon?: React.ReactElement;
    onCustomCopy?: () => void;
    onChange?: (value: string, name?: string) => any;
  };

export const InputFieldBase = observer<InputFieldBaseProps, HTMLInputElement>(
  forwardRef(function InputFieldBase(
    {
      name,
      value,
      defaultValue,
      required,
      children,
      className,
      error,
      loading,
      description,
      labelTooltip,
      canShowPassword = true,
      onChange,
      onCustomCopy,
      icon,
      ...rest
    },
    ref,
  ) {
    const [uncontrolledInputValue, setUncontrolledInputValue] = useState(value);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const mergedRef = useCombinedRef(inputRef, ref);
    const capsLock = useCapsLockTracker();
    const [passwordRevealed, setPasswordRevealed] = useState(false);
    const translate = useTranslate();
    const layoutProps = getLayoutProps(rest);
    rest = filterLayoutFakeProps(rest);
    const styles = useS(inputFieldStyle);
    loading = useStateDelay(loading ?? false, 300);

    const revealPassword = useCallback(() => {
      if (rest.disabled) {
        return;
      }

      setPasswordRevealed(prev => !prev);
    }, [rest.disabled]);

    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setUncontrolledInputValue(event.target.value);
        onChange?.(event.target.value, name);
      },
      [name, onChange],
    );

    const handleBlur = useCombinedHandler(rest.onBlur, capsLock.handleBlur);
    const handleKeyDown = useCombinedHandler(rest.onKeyDown, capsLock.handleKeyDown);

    const passwordType = rest.type === 'password';
    let uncontrolled = passwordType && !canShowPassword;

    if (passwordType && !rest.readOnly && capsLock.warn) {
      description = translate('ui_capslock_on');
    }

    uncontrolled ||= value === undefined;

    useLayoutEffect(() => {
      if (uncontrolled && isNotNullDefined(value) && inputRef.current) {
        inputRef.current.value = value;

        if (uncontrolledInputValue !== value) {
          setUncontrolledInputValue(value);
        }
      }
    });

    if (!uncontrolledInputValue) {
      canShowPassword = false;
    }

    useValidationStyles(inputRef);

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
            value={uncontrolled ? undefined : value}
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
