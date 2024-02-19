/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { isNotNullDefined, isObject } from '@cloudbeaver/core-utils';

import { useCombinedHandler } from '../useCombinedHandler';
import type { IFormStateControl } from './IFormStateControl';
import { isControlPresented } from './isControlPresented';

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
  if (isNotNullDefined(defaultValue) && isObject(defaultValue)) {
    defaultValue = defaultValue[name];
  }

  if (isNotNullDefined(value) && isObject(value)) {
    value = value[name];
  }

  let stringValue: string | typeof value;
  let defaultStringValue: string | typeof defaultValue;
  if (mapToString) {
    stringValue = mapToString(value as any);
    defaultStringValue = mapToString(defaultValue as any);
  } else {
    stringValue = value;
    defaultStringValue = defaultValue;
  }

  const hide = 'autoHide' in rest && !!rest.autoHide && !isControlPresented(String(name), stringValue, defaultStringValue);

  return { name, value, stringValue, defaultValue, defaultStringValue, hide, onChange: handleChange };
}
