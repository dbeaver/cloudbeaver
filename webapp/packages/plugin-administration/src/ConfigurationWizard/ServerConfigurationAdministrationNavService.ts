/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { ADMINISTRATION_SERVER_CONFIGURATION_ITEM } from './ServerConfiguration/ADMINISTRATION_SERVER_CONFIGURATION_ITEM.js';

export class ServerConfigurationAdministrationNavServiceImpl {
  constructor(private readonly administrationScreenService: AdministrationScreenService) {}

  navToSettings(): void {
    this.administrationScreenService.navigateToItem(ADMINISTRATION_SERVER_CONFIGURATION_ITEM);
  }
}

export type ServerConfigurationAdministrationNavService = ServerConfigurationAdministrationNavServiceImpl;

export class ServerConfigurationAdministrationNavServiceDI extends Context.Service<
  ServerConfigurationAdministrationNavServiceDI,
  ServerConfigurationAdministrationNavServiceImpl
>()(
  '@cloudbeaver/plugin-administration/ConfigurationWizard/ServerConfigurationAdministrationNavService#ServerConfigurationAdministrationNavService',
) {
  static readonly implementation = ServerConfigurationAdministrationNavServiceImpl;

  static readonly dependencies = () => [AdministrationScreenService] as const;
  static readonly make: Effect.Effect<
    ServerConfigurationAdministrationNavServiceImpl,
    never,
    Context.Service.Identifier<typeof AdministrationScreenService>
  > = Effect.gen(function* makeServerConfigurationAdministrationNavService() {
    const administrationScreenService = yield* AdministrationScreenService;

    return new ServerConfigurationAdministrationNavServiceImpl(administrationScreenService);
  });
  static readonly layer: Layer.Layer<
    ServerConfigurationAdministrationNavServiceDI,
    never,
    Context.Service.Identifier<typeof AdministrationScreenService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ServerConfigurationAdministrationNavService = ServerConfigurationAdministrationNavServiceDI;
