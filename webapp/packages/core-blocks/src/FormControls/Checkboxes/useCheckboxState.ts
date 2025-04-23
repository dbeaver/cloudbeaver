/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { runInAction } from 'mobx';
import { useContext, useState } from 'react';

import { useObjectRef } from '../../useObjectRef.js';
import { FormContext } from '../FormContext.js';

export type CheckboxOnChangeEvent<T> = (value: boolean, name: T) => void;

export type CheckboxStateOptions<TKey extends string> = {
  value: string | undefined;
  defaultValue: string | undefined;
  checked: boolean | undefined;
  defaultChecked: boolean | undefined;
  inverse: boolean | undefined;
} & (
  | {
      state: undefined;
      name: string | undefined;
      onChange: CheckboxOnChangeEvent<string | undefined> | undefined;
    }
  | {
      state: Record<TKey, boolean | undefined | null | string | string[]> | undefined;
      name: TKey;
      onChange: CheckboxOnChangeEvent<TKey> | undefined;
    }
);

interface ICheckboxState {
  checked: boolean | undefined;
  change: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function useCheckboxState<TKey extends string>(options: CheckboxStateOptions<TKey>): ICheckboxState {
  const [count, refresh] = useState(0);
  const context = useContext(FormContext);
  const controlledValue = options.value ?? options.defaultValue ?? undefined;
  const optionsRef = useObjectRef({ ...options, context, count, value: controlledValue });
  const { state, name, value } = optionsRef;

  let checked = optionsRef.checked ?? optionsRef.defaultChecked ?? undefined;

  if (state !== undefined && name !== undefined) {
    if (name in state) {
      const currentState = state[name as TKey];

      if (typeof value === 'string') {
        checked = Array.isArray(currentState) ? currentState.includes(value) : currentState === value;
      } else if (typeof currentState === 'string') {
        checked = currentState.toLowerCase() === 'true';
      } else {
        checked = !!currentState;
      }
    } else {
      checked = false;
    }
  }

  if (options.inverse) {
    checked = !checked;
  }

  return useObjectRef<ICheckboxState>(
    () => ({
      checked,
      change(event: React.ChangeEvent<HTMLInputElement>) {
        runInAction(() => {
          const { inverse, state, name, value, onChange, count, context } = optionsRef;
          let checked = event.target.checked;

          if (inverse) {
            checked = !checked;
          }

          if (state !== undefined && name !== undefined) {
            const currentState = state[name as TKey];

            if (typeof value === 'string') {
              if (Array.isArray(currentState)) {
                const elementIndex = currentState.indexOf(value);
                if (checked && elementIndex === -1) {
                  currentState.push(value);
                } else if (elementIndex !== -1) {
                  currentState.splice(elementIndex, 1);
                }
              } else {
                state[name as TKey] = value;
              }
            } else {
              state[name as TKey] = checked;
            }
          }

          onChange?.(checked, name as TKey);
          context?.change(checked, name);

          refresh(count + 1);
        });
      },
    }),
    { checked },
    ['change'],
  );
}
