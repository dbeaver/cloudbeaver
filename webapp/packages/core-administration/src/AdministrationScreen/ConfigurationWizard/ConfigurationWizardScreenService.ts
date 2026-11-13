/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { ScreenService } from '@cloudbeaver/core-routing';

import { AdministrationScreenService } from '../AdministrationScreenService.js';
import { ConfigurationWizardService } from './ConfigurationWizardService.js';

export class ConfigurationWizardScreenServiceImpl {
  constructor(
    private readonly administrationScreenService: AdministrationScreenService,
    private readonly screenService: ScreenService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly configurationWizardService: ConfigurationWizardService,
  ) {
    this.screenService.routeChange.addHandler(this.onRouteChange.bind(this));
  }

  private async onRouteChange() {
    // this is need for this.isConfigurationMode
    await this.serverConfigResource.load();

    if (!this.administrationScreenService.isConfigurationMode) {
      return;
    }

    const isCurrentStepAvailable =
      this.configurationWizardService.currentStep &&
      this.configurationWizardService.isStepAvailable(this.configurationWizardService.currentStep.name);

    if (!isCurrentStepAvailable) {
      this.administrationScreenService.navigateToRoot();
    }
  }
}

export type ConfigurationWizardScreenService = ConfigurationWizardScreenServiceImpl;

export class ConfigurationWizardScreenServiceDI extends Context.Service<ConfigurationWizardScreenServiceDI, ConfigurationWizardScreenServiceImpl>()(
  '@cloudbeaver/core-administration/AdministrationScreen/ConfigurationWizard/ConfigurationWizardScreenService#ConfigurationWizardScreenService',
) {
  static readonly implementation = ConfigurationWizardScreenServiceImpl;

  static readonly dependencies = () => [AdministrationScreenService, ScreenService, ServerConfigResource, ConfigurationWizardService] as const;
  static readonly make: Effect.Effect<
    ConfigurationWizardScreenServiceImpl,
    never,
    | Context.Service.Identifier<typeof AdministrationScreenService>
    | Context.Service.Identifier<typeof ScreenService>
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof ConfigurationWizardService>
  > = Effect.gen(function* makeConfigurationWizardScreenService() {
    const administrationScreenService = yield* AdministrationScreenService;
    const screenService = yield* ScreenService;
    const serverConfigResource = yield* ServerConfigResource;
    const configurationWizardService = yield* ConfigurationWizardService;

    return new ConfigurationWizardScreenServiceImpl(administrationScreenService, screenService, serverConfigResource, configurationWizardService);
  });
  static readonly layer: Layer.Layer<
    ConfigurationWizardScreenServiceDI,
    never,
    | Context.Service.Identifier<typeof AdministrationScreenService>
    | Context.Service.Identifier<typeof ScreenService>
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof ConfigurationWizardService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConfigurationWizardScreenService = ConfigurationWizardScreenServiceDI;
