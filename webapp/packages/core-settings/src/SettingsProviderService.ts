/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { schema } from '@cloudbeaver/core-utils';

import { SettingsProvider } from './SettingsProvider.js';
import { SettingsResolverService } from './SettingsResolverService.js';
import { UserSettingsResolverService } from './UserSettingsResolverService.js';
import { SettingsResolverSource } from './SettingsResolverSource.js';

@injectable(() => [SettingsResolverService, UserSettingsResolverService])
export class SettingsProviderService {
  get schema(): schema.ZodObject {
    return this.mergedSchema;
  }
  get settingsResolver(): SettingsResolverSource {
    return this.resolver;
  }
  private mergedSchema: schema.ZodObject;
  private resolver: SettingsResolverSource;
  constructor(settingsResolverService: SettingsResolverService, userSettingsResolverService: UserSettingsResolverService) {
    this.mergedSchema = schema.object({});
    this.resolver = new SettingsResolverSource();

    this.resolver.add(settingsResolverService, userSettingsResolverService);

    makeObservable<this, 'mergedSchema'>(this, {
      mergedSchema: observable.ref,
    });
  }

  createSettings<TSchema extends schema.ZodObject = schema.ZodObject>(schema: TSchema): SettingsProvider<TSchema> {
    this.mergedSchema = this.mergedSchema.merge(schema);
    const settings = new SettingsProvider(this.resolver, schema);
    return settings;
  }
}
