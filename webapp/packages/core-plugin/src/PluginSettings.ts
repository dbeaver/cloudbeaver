/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ISettingsSource } from '@cloudbeaver/core-settings';
import type { schema } from '@cloudbeaver/core-utils';

export class PluginSettings<TSchema extends schema.SomeZodObject = schema.AnyZodObject> implements ISettingsSource {
  constructor(private readonly source: ISettingsSource, readonly scope: string, readonly schema: TSchema) {}

  isReadOnly<TKey extends keyof schema.infer<TSchema>>(key: TKey): boolean {
    return this.source.has(key) || false;
  }

  has<TKey extends keyof schema.infer<TSchema>>(key: TKey): boolean {
    return true;
  }

  isValueDefault<TKey extends keyof schema.infer<TSchema>>(key: TKey): boolean {
    return !this.source.has(this.scopedKey(key));
  }

  getDefaultValue<TKey extends keyof schema.infer<TSchema>>(key: TKey): schema.infer<TSchema>[TKey] {
    const value = this.source.getDefaultValue(this.scopedKey(key));
    const schema = this.schema.shape[key as any];
    const result = schema.safeParse(value);

    if (result.success) {
      return result.data;
    }

    return schema.parse(undefined);
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
    throw new Error(`Can't set value for key ${String(this.scopedKey(key))}`);
  }

  clear(): void {
    throw new Error("Can't clear settings");
  }

  private scopedKey(key: string | number | symbol): string {
    return `${this.scope}.${String(key)}`;
  }
}
