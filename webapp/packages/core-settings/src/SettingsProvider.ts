/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { isNotNullDefined, type schema } from '@cloudbeaver/core-utils';

import type { ISettingsSource } from './ISettingsSource';

export class SettingsProvider<TSchema extends schema.SomeZodObject = schema.AnyZodObject> implements ISettingsSource {
  constructor(
    private readonly source: ISettingsSource,
    readonly scope: string,
    readonly schema: TSchema,
  ) {}

  isReadOnly<TKey extends keyof schema.infer<TSchema>>(key: TKey): boolean {
    return this.source.isReadOnly(this.scopedKey(key)) || false;
  }

  isEdited(key?: any): boolean {
    return this.source.isEdited(this.scopedKey(key));
  }

  has<TKey extends keyof schema.infer<TSchema>>(key: TKey): boolean {
    return true;
  }

  isValueDefault<TKey extends keyof schema.infer<TSchema>>(key: TKey): boolean {
    return !this.source.has(this.scopedKey(key));
  }

  getEditedValue<TKey extends keyof schema.infer<TSchema>>(key: TKey): schema.infer<TSchema>[TKey] {
    return this.getValue(key);
  }

  getValue<TKey extends keyof schema.infer<TSchema>>(key: TKey): schema.infer<TSchema>[TKey] {
    let value = undefined;

    if (this.source.has(this.scopedKey(key))) {
      value = this.source.getValue(this.scopedKey(key));
    }

    const schema = this.schema.shape[key as any];
    const result = schema.safeParse(value);

    if (result.success) {
      return result.data;
    }

    return schema.parse(undefined);
  }

  setValue<TKey extends keyof schema.infer<TSchema>>(key: TKey, value: schema.infer<TSchema>[TKey]): void {
    this.source.setValue(this.scopedKey(key), value);
  }

  clear(): void {
    this.source.clear();
  }

  async save(): Promise<void> {
    await this.source.save();
  }

  scopedKey<T extends string | number | symbol | undefined | null>(key: T): Exclude<T | string, number | symbol> {
    if (isNotNullDefined(key)) {
      return `${this.scope}.${String(key)}`;
    }

    return key;
  }
}
