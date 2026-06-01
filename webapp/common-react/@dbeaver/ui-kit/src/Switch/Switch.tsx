/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import clsx from 'clsx';
import './Switch.css';

export interface SwitchBaseProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  className?: string;
  children?: React.ReactNode;
}

export function SwitchBase({ checked, disabled, children, className, id, onChange, ...inputRest }: SwitchBaseProps): React.ReactElement {
  return (
    <div className={clsx('dbv-kit-switch', className)}>
      <div
        className={clsx('dbv-kit-switch__control', {
          'dbv-kit-switch__control--checked': checked,
          'dbv-kit-switch__control--disabled': disabled,
        })}
      >
        <div className="dbv-kit-switch__track" />
        <div className="dbv-kit-switch__underlay">
          <div className="dbv-kit-switch__thumb" />
          <input
            {...inputRest}
            type="checkbox"
            id={id}
            role="switch"
            aria-checked={checked}
            checked={checked}
            disabled={disabled}
            className="dbv-kit-switch__input"
            onChange={onChange}
          />
        </div>
      </div>
      {children}
    </div>
  );
}
