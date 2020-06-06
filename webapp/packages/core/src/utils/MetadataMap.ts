/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

export type DefaultValueGetter<TKey, TValue> = (key: TKey, metadata: MetadataMap<TKey, TValue>) => TValue

export class MetadataMap<TKey, TValue> {
  private data: Map<TKey, TValue>;

  constructor(private defaultValueGetter: DefaultValueGetter<TKey, TValue>) {
    this.data = observable(new Map());
  }

  get(key: TKey): TValue {
    if (this.data.has(key)) {
      return this.data.get(key)!;
    }
    const value = this.defaultValueGetter(key, this);
    this.data.set(key, value);
    return value;
  }

  delete(key: TKey) {
    this.data.delete(key);
  }
}
