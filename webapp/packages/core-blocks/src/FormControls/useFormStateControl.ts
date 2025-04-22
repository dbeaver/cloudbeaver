/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { isObject } from '@cloudbeaver/core-utils';
import { isNotNullDefined } from '@dbeaver/js-helpers';

import { useCombinedHandler } from '../useCombinedHandler.js';
import type { IFormStateControl } from './IFormStateControl.js';
import { isControlPresented } from './isControlPresented.js';

export function useFormStateControl<TState extends Record<string, any>, TKey extends keyof TState>({
  name,
  state: value,
  defaultState: defaultValue,
  mapState: mapToString,
  mapValue: mapToValue,
  onChange,
  ...rest
}: IFormStateControl<TState, TKey>) {
  const originalValue = value;
  const handleChange = useCombinedHandler(function handleChange(inputValue: string) {
    if (mapToValue) {
      inputValue = mapToValue(inputValue);
    }

    if (isNotNullDefined(originalValue) && isObject(originalValue)) {
      (originalValue as any)[name] = inputValue;
    }

    if (onChange) {
      onChange(inputValue as any, name as any);
    }
  });

  let presented: boolean | undefined;

  if (isNotNullDefined(defaultValue) && isObject(defaultValue)) {
    presented = isControlPresented(name, defaultValue);
    defaultValue = defaultValue[name];
  }

  if (isNotNullDefined(value) && isObject(value)) {
    presented = presented || isControlPresented(name, value, defaultValue);
    value = value[name];
  }

  let stringValue: string | typeof value | null;
  let defaultStringValue: string | typeof defaultValue | null;
  if (mapToString) {
    stringValue = mapToString(value as any);
    defaultStringValue = mapToString(defaultValue as any);
  } else {
    stringValue = isNotNullDefined(value) ? String(value) : null;
    defaultStringValue = isNotNullDefined(defaultValue) ? String(defaultValue) : null;
  }

  const hide = 'autoHide' in rest && !!rest.autoHide && presented === false;

  return { name, value, stringValue, defaultValue, defaultStringValue, hide, onChange: handleChange };
}
