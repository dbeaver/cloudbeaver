/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { schema } from '@cloudbeaver/core-utils';

import { SettingsProvider } from './SettingsProvider.js';
import { SettingsResolverService } from './SettingsResolverService.js';

@injectable()
export class SettingsProviderService {
  get schema(): schema.AnyZodObject {
    return this.mergedSchema;
  }
  private mergedSchema: schema.AnyZodObject;
  constructor(private readonly settingsResolverService: SettingsResolverService) {
    this.mergedSchema = schema.object({});

    makeObservable<this, 'mergedSchema'>(this, {
      mergedSchema: observable.ref,
    });
  }

  createSettings<TSchema extends schema.SomeZodObject = schema.AnyZodObject>(schema: TSchema) {
    this.mergedSchema = this.mergedSchema.merge(schema);
    const settings = new SettingsProvider(this.settingsResolverService, schema);
    return settings;
  }
}
