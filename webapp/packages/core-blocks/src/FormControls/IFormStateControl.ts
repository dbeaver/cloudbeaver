/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IFormStateControl<TState extends Record<string, any>, TKey extends keyof TState> {
  name: TKey;
  state: TState;
  defaultState?: Readonly<Partial<TState>>;
  autoHide?: boolean;
  mapState?: (value: TState[TKey]) => string;
  mapValue?: (value: string) => TState[TKey];
  onChange?: (value: TState[TKey], name: TKey) => any;
}
