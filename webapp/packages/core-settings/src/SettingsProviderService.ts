/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { schema } from '@cloudbeaver/core-utils';

import { SettingsProvider } from './SettingsProvider.js';
import { SettingsResolverService } from './SettingsResolverService.js';
import { SettingsResolverSource } from './SettingsResolverSource.js';
import { UserSettingsResolverService } from './UserSettingsResolverService.js';

export class SettingsProviderServiceImpl {
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

export type SettingsProviderService = SettingsProviderServiceImpl;

export class SettingsProviderServiceDI extends Context.Service<SettingsProviderServiceDI, SettingsProviderServiceImpl>()(
  '@cloudbeaver/core-settings/SettingsProviderService#SettingsProviderService',
) {
  static readonly implementation = SettingsProviderServiceImpl;

  static readonly dependencies = () => [SettingsResolverService, UserSettingsResolverService] as const;
  static readonly make: Effect.Effect<
    SettingsProviderServiceImpl,
    never,
    Context.Service.Identifier<typeof SettingsResolverService> | Context.Service.Identifier<typeof UserSettingsResolverService>
  > = Effect.gen(function* makeSettingsProviderService() {
    const settingsResolverService = yield* SettingsResolverService;
    const userSettingsResolverService = yield* UserSettingsResolverService;

    return new SettingsProviderServiceImpl(settingsResolverService, userSettingsResolverService);
  });
  static readonly layer: Layer.Layer<
    SettingsProviderServiceDI,
    never,
    Context.Service.Identifier<typeof SettingsResolverService> | Context.Service.Identifier<typeof UserSettingsResolverService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SettingsProviderService = SettingsProviderServiceDI;
