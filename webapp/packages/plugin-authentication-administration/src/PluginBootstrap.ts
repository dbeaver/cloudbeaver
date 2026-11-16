/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ServerConfigurationAdministrationNavService, ServerConfigurationFormService } from '@cloudbeaver/plugin-administration';
import { AuthenticationService } from '@cloudbeaver/plugin-authentication';

import { TeamsAdministrationService } from './Administration/Users/Teams/TeamsAdministrationService.js';

const ServerConfigurationAuthenticationPanel = importLazyComponent(() =>
  import('./Administration/ServerConfiguration/ServerConfigurationAuthenticationPanel.js').then(m => m.ServerConfigurationAuthenticationPanel),
);

export class PluginBootstrapImpl extends Bootstrap {
  constructor(
    private readonly serverConfigurationAdministrationNavService: ServerConfigurationAdministrationNavService,
    private readonly authenticationService: AuthenticationService,
    private readonly teamsAdministrationService: TeamsAdministrationService,
    private readonly serverConfigurationFormService: ServerConfigurationFormService,
  ) {
    super();
  }

  override register(): void {
    this.serverConfigurationFormService.parts.add({
      key: 'authentication',
      name: 'authentication_administration_server_configuration_authentication',
      order: 2,
      panel: () => ServerConfigurationAuthenticationPanel,
    });

    this.teamsAdministrationService.register();
    this.authenticationService.setConfigureAuthProvider(() => this.serverConfigurationAdministrationNavService.navToSettings());
  }
}

export type PluginBootstrap = PluginBootstrapImpl;

export class PluginBootstrapDI extends Context.Service<PluginBootstrapDI, PluginBootstrapImpl>()(
  '@cloudbeaver/plugin-authentication-administration/PluginBootstrap#PluginBootstrap',
) {
  static readonly implementation = PluginBootstrapImpl;

  static readonly dependencies = () =>
    [ServerConfigurationAdministrationNavService, AuthenticationService, TeamsAdministrationService, ServerConfigurationFormService] as const;
  static readonly make: Effect.Effect<
    PluginBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof ServerConfigurationAdministrationNavService>
    | Context.Service.Identifier<typeof AuthenticationService>
    | Context.Service.Identifier<typeof TeamsAdministrationService>
    | Context.Service.Identifier<typeof ServerConfigurationFormService>
  > = Effect.gen(function* makePluginBootstrap() {
    const serverConfigurationAdministrationNavService = yield* ServerConfigurationAdministrationNavService;
    const authenticationService = yield* AuthenticationService;
    const teamsAdministrationService = yield* TeamsAdministrationService;
    const serverConfigurationFormService = yield* ServerConfigurationFormService;

    return new PluginBootstrapImpl(
      serverConfigurationAdministrationNavService,
      authenticationService,
      teamsAdministrationService,
      serverConfigurationFormService,
    );
  });
  static readonly layer: Layer.Layer<
    PluginBootstrapDI,
    never,
    | Context.Service.Identifier<typeof ServerConfigurationAdministrationNavService>
    | Context.Service.Identifier<typeof AuthenticationService>
    | Context.Service.Identifier<typeof TeamsAdministrationService>
    | Context.Service.Identifier<typeof ServerConfigurationFormService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const PluginBootstrap = PluginBootstrapDI;
