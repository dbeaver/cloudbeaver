/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext, useContext } from 'react';

export interface SwitchContextValue {
  checked: boolean;
  disabled: boolean;
  focusVisible: boolean;
  inputId: string;
  inputProps: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'defaultChecked' | 'disabled' | 'id' | 'onChange'>;
  handleChange: React.ChangeEventHandler<HTMLInputElement>;
  handleFocus: React.FocusEventHandler<HTMLInputElement>;
  handleBlur: React.FocusEventHandler<HTMLInputElement>;
}

export const SwitchContext = createContext<SwitchContextValue | null>(null);

export function useSwitchContext(): SwitchContextValue {
  const context = useContext(SwitchContext);

  if (!context) {
    throw new Error('Switch components must be used within Switch.Provider');
  }

  return context;
}
