/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import './Switch.css';
import clsx from 'clsx';
import { useSwitchContext } from './SwitchContext.js';
import { SwitchProvider } from './SwitchProvider.js';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  className?: string;
  children?: React.ReactNode;
}

function SwitchInput({ className, id, onBlur, onChange, onFocus, ...props }: React.InputHTMLAttributes<HTMLInputElement>): React.ReactElement {
  const { checked, disabled, focusVisible, inputId, inputProps, handleBlur, handleChange, handleFocus } = useSwitchContext();

  return (
    <input
      {...inputProps}
      {...props}
      type="checkbox"
      role="switch"
      id={id || inputId}
      aria-checked={checked}
      checked={checked}
      disabled={disabled}
      data-checked={checked || undefined}
      data-disabled={disabled || undefined}
      data-focus-visible={focusVisible || undefined}
      className={clsx('dbv-kit-switch__input', className)}
      onChange={event => {
        handleChange(event);
        onChange?.(event);
      }}
      onFocus={event => {
        handleFocus(event);
        onFocus?.(event);
      }}
      onBlur={event => {
        handleBlur(event);
        onBlur?.(event);
      }}
    />
  );
}

function SwitchLabel({ children, className, htmlFor, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>): React.ReactElement {
  const { checked, disabled, focusVisible, inputId } = useSwitchContext();

  return (
    <label
      {...props}
      className={clsx('dbv-kit-switch__label', className)}
      htmlFor={htmlFor || inputId}
      data-checked={checked || undefined}
      data-disabled={disabled || undefined}
      data-focus-visible={focusVisible || undefined}
    >
      {children}
    </label>
  );
}

function SwitchTrack(): React.ReactElement {
  const { checked, disabled, focusVisible } = useSwitchContext();

  return (
    <div
      className="dbv-kit-switch__track"
      data-checked={checked || undefined}
      data-disabled={disabled || undefined}
      data-focus-visible={focusVisible || undefined}
    />
  );
}

function SwitchThumb(): React.ReactElement {
  const { checked, disabled, focusVisible } = useSwitchContext();

  return (
    <div
      className="dbv-kit-switch__thumb"
      data-checked={checked || undefined}
      data-disabled={disabled || undefined}
      data-focus-visible={focusVisible || undefined}
    />
  );
}

export const Switch = {
  Provider: SwitchProvider,
  Input: SwitchInput,
  Track: SwitchTrack,
  Thumb: SwitchThumb,
  Label: SwitchLabel,
};

export { useSwitchContext };
