/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ServerConfigResource } from '@cloudbeaver/core-root';

export class ServerLocalizationServiceImpl {
  constructor(
    private readonly serverConfigResource: ServerConfigResource,
    private readonly localizationService: LocalizationService,
  ) {
    this.serverConfigResource.onDataUpdate.addHandler(this.updateSupportedLocalization.bind(this));
  }

  private updateSupportedLocalization() {
    const supportedLanguages = this.serverConfigResource.data?.supportedLanguages;

    if (supportedLanguages) {
      this.localizationService.setSupportedLanguages(
        supportedLanguages.map(lang => ({
          isoCode: lang.isoCode,
          name: lang.displayName ?? lang.isoCode,
          nativeName: lang.nativeName,
        })),
      );
    }
  }
}

export type ServerLocalizationService = ServerLocalizationServiceImpl;

export class ServerLocalizationServiceDI extends Context.Service<ServerLocalizationServiceDI, ServerLocalizationServiceImpl>()(
  '@cloudbeaver/core-server-localization/ServerLocalizationService#ServerLocalizationService',
) {
  static readonly implementation = ServerLocalizationServiceImpl;

  static readonly dependencies = () => [ServerConfigResource, LocalizationService] as const;
  static readonly make: Effect.Effect<
    ServerLocalizationServiceImpl,
    never,
    Context.Service.Identifier<typeof ServerConfigResource> | Context.Service.Identifier<typeof LocalizationService>
  > = Effect.gen(function* makeServerLocalizationService() {
    const serverConfigResource = yield* ServerConfigResource;
    const localizationService = yield* LocalizationService;

    return new ServerLocalizationServiceImpl(serverConfigResource, localizationService);
  });
  static readonly layer: Layer.Layer<
    ServerLocalizationServiceDI,
    never,
    Context.Service.Identifier<typeof ServerConfigResource> | Context.Service.Identifier<typeof LocalizationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ServerLocalizationService = ServerLocalizationServiceDI;
