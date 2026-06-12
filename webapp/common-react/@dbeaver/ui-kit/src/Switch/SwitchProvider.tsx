/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import clsx from 'clsx';
import { useId, useState, useMemo } from 'react';
import type { SwitchProps } from './Switch.js';
import { type SwitchContextValue, SwitchContext } from './SwitchContext.js';

export interface SwitchProviderProps extends SwitchProps {}

export function SwitchProvider({
  children,
  className,
  checked: controlledChecked,
  defaultChecked = false,
  disabled = false,
  id,
  onBlur,
  onChange,
  onFocus,
  ...inputProps
}: SwitchProviderProps): React.ReactElement {
  const generatedId = useId();
  const [innerChecked, setInnerChecked] = useState(defaultChecked);
  const [focusVisible, setFocusVisible] = useState(false);
  const checked = controlledChecked ?? innerChecked;
  const inputId = id || generatedId;

  const context = useMemo<SwitchContextValue>(
    () => ({
      checked,
      disabled,
      focusVisible,
      inputId,
      inputProps,
      handleChange(event) {
        setInnerChecked(event.target.checked);
        onChange?.(event);
      },
      handleFocus(event) {
        setFocusVisible(event.target.matches(':focus-visible'));
        onFocus?.(event);
      },
      handleBlur(event) {
        setFocusVisible(false);
        onBlur?.(event);
      },
    }),
    [checked, disabled, focusVisible, inputId, inputProps, onBlur, onChange, onFocus],
  );

  return (
    <SwitchContext.Provider value={context}>
      <div
        className={clsx('dbv-kit-switch', className)}
        data-checked={checked || undefined}
        data-disabled={disabled || undefined}
        data-focus-visible={focusVisible || undefined}
      >
        {children}
      </div>
    </SwitchContext.Provider>
  );
}
