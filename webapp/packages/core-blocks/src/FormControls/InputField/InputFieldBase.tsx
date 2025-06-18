/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { forwardRef, useCallback, useLayoutEffect, useRef, useState } from 'react';

import { isNotNullDefined } from '@dbeaver/js-helpers';

import { filterLayoutFakeProps, getLayoutProps } from '../../Containers/filterLayoutFakeProps.js';
import type { ILayoutSizeProps } from '../../Containers/ILayoutSizeProps.js';
import { Icon } from '../../Icon.js';
import { useTranslate } from '../../localization/useTranslate.js';
import { s } from '../../s.js';
import { useCombinedHandler } from '../../useCombinedHandler.js';
import { useCombinedRef } from '../../useCombinedRef.js';
import { useS } from '../../useS.js';
import { useStateDelay } from '../../useStateDelay.js';
import { Field } from '../Field.js';
import { FieldDescription } from '../FieldDescription.js';
import { FieldLabel } from '../FieldLabel.js';
import { useCapsLockTracker } from '../useCapsLockTracker.js';
import inputFieldStyle from './InputField.module.css';
import { IconButton, Input, Spinner, type InputProps } from '@dbeaver/ui-kit';

export type InputFieldBaseProps = Omit<InputProps, 'onChange'> &
  ILayoutSizeProps & {
    size?: 'small' | 'medium' | 'large';
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

    return (
      <Field {...layoutProps} className={s(styles, {}, className)}>
        <FieldLabel title={labelTooltip || rest.title} className={s(styles, { fieldLabel: true })} required={required}>
          {children}
        </FieldLabel>
        <div className={s(styles, { inputContainer: true })}>
          <Input
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
              <Spinner size="small" />
            </div>
          )}
          {passwordType && canShowPassword && (
            <IconButton
              variant="secondary"
              size="small"
              aria-label={translate('ui_reveal_password')}
              title={translate('ui_reveal_password')}
              className={styles['iconContainer']}
              onClick={revealPassword}
            >
              <Icon width={16} height={16} name={passwordRevealed ? 'password-hide' : 'password-show'} viewBox="0 0 16 16" />
            </IconButton>
          )}
          {onCustomCopy && (
            <IconButton
              size="small"
              aria-label={translate('ui_copy_to_clipboard')}
              title={translate('ui_copy_to_clipboard')}
              className={styles['iconContainer']}
              onClick={onCustomCopy}
            >
              <Icon width={16} height={16} name="copy" viewBox="0 0 32 32" />
            </IconButton>
          )}
          {icon && <div className={s(styles, { customIconContainer: true })}>{icon}</div>}
        </div>
        {(description || passwordType) && <FieldDescription invalid={error}>{description}</FieldDescription>}
      </Field>
    );
  }),
);
