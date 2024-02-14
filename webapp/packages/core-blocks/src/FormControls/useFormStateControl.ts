/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';

import { isNotNullDefined } from '@cloudbeaver/core-utils';

import { useObservableRef } from '../useObservableRef';
import type { IFormStateControl } from './IFormStateControl';

export function useFormStateControl<TState extends Record<string, any>, TKey extends keyof TState>({
  name,
  defaultState,
  state,
  mapState,
  mapValue,
  onChange,
}: IFormStateControl<TState, TKey>) {
  return useObservableRef(
    () => ({
      get value() {
        let value: any = undefined;

        if (this.defaultState && this.name in this.defaultState && isNotNullDefined(this.defaultState[this.name])) {
          value = this.defaultState[this.name];
        }

        if (this.state && this.name in this.state && isNotNullDefined(this.state[this.name])) {
          value = this.state[this.name];
        }

        if (this.mapState) {
          value = this.mapState(value);
        }

        return value;
      },
      setValue(value: TState[TKey]) {
        if (this.mapValue) {
          value = this.mapValue(value as any) as any;
        }

        if (this.state) {
          this.state[this.name] = value as any;
        }

        if (this.onChange) {
          this.onChange(value, this.name);
        }
      },
    }),
    {
      value: computed,
      setValue: action.bound,
      name: observable,
      defaultState: observable.ref,
      state: observable.ref,
      mapState: observable.ref,
      mapValue: observable.ref,
      onChange: observable.ref,
    },
    { name, defaultState, state, mapState, mapValue, onChange },
  );
}
