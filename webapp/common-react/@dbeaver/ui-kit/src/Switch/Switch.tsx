/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import clsx from 'clsx';
import './Switch.css';
import { useId, useState } from 'react';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  className?: string;
  children?: React.ReactNode;
}

function SwitchBase({ disabled, children, className, id, ...props }: SwitchProps): React.ReactElement {
  const labelId = useId();
  const [innerChecked, setInnerChecked] = useState(props.defaultChecked ?? false);
  const checked = props.checked ?? innerChecked;

  return (
    <Switch.Label className={clsx('dbv-kit-switch', className)}>
      <Switch.Control
        className={clsx({
          'dbv-kit-switch__control--checked': checked,
          'dbv-kit-switch__control--disabled': disabled,
        })}
      >
        <Switch.Track />
        <Switch.Input
          {...props}
          type="checkbox"
          id={id || labelId}
          role="switch"
          aria-checked={checked}
          checked={checked}
          disabled={disabled}
          onChange={event => {
            setInnerChecked(event.target.checked);
            props.onChange?.(event);
          }}
        />
        <Switch.Thumb />
      </Switch.Control>
      {children}
    </Switch.Label>
  );
}

function SwitchControl({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={clsx('dbv-kit-switch__control', className)}>{children}</div>;
}

function SwitchInput({ className, role, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} type="checkbox" role="switch" className={clsx('dbv-kit-switch__input', className)} />;
}

function SwitchLabel({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <label className={clsx('dbv-kit-switch__label', className)}>{children}</label>;
}

function SwitchTrack() {
  return <div className="dbv-kit-switch__track" />;
}

function SwitchThumb() {
  return <div className="dbv-kit-switch__thumb" />;
}

export const Switch = Object.assign(SwitchBase, {
  Control: SwitchControl,
  Input: SwitchInput,
  Track: SwitchTrack,
  Thumb: SwitchThumb,
  Label: SwitchLabel,
});
