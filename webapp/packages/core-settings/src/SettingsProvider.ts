/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import type { schema } from '@cloudbeaver/core-utils';

import type { ISettingChangeData, ISettingsSource } from './ISettingsSource.js';

export class SettingsProvider<TSchema extends schema.SomeZodObject = any> implements ISettingsSource {
  readonly onChange: ISyncExecutor<ISettingChangeData<keyof schema.infer<TSchema>>>;
  constructor(
    private readonly source: ISettingsSource,
    readonly schema: TSchema,
  ) {
    this.onChange = new SyncExecutor();
    source.onChange.next(
      this.onChange,
      data => data,
      data => data.key in this.schema.shape,
    );
  }

  isReadOnly<TKey extends keyof schema.infer<TSchema>>(key: TKey): boolean {
    return this.source.isReadOnly(key) || false;
  }

  isEdited(key?: any): boolean {
    return this.source.isEdited(key);
  }

  has<TKey extends keyof schema.infer<TSchema>>(key: TKey): boolean {
    return true;
  }

  isValueDefault<TKey extends keyof schema.infer<TSchema>>(key: TKey): boolean {
    return !this.source.has(key);
  }

  getEditedValue<TKey extends keyof schema.infer<TSchema>>(key: TKey): schema.infer<TSchema>[TKey] {
    return this.getValue(key);
  }

  getValue<TKey extends keyof schema.infer<TSchema>>(key: TKey): schema.infer<TSchema>[TKey] {
    let value = undefined;

    if (this.source.has(key)) {
      value = this.source.getValue(key);
    }

    if (key in this.schema.shape) {
      const schema = this.schema.shape[key as any]!;
      const result = schema.safeParse(value);

      if (result.success) {
        return result.data;
      }

      return schema.parse(undefined);
    }

    return value;
  }

  setValue<TKey extends keyof schema.infer<TSchema>>(key: TKey, value: schema.infer<TSchema>[TKey]): void {
    this.source.setValue(key, value);
  }

  clear(): void {
    this.source.clear();
  }

  async save(): Promise<void> {
    await this.source.save();
  }
}
