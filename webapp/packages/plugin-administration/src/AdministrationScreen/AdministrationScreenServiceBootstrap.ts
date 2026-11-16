/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AdministrationScreenService, AdministrationScreenServiceImpl } from '@cloudbeaver/core-administration';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { ScreenService } from '@cloudbeaver/core-routing';

const AdministrationScreen = importLazyComponent(() => import('./AdministrationScreen.js').then(m => m.AdministrationScreen));
const ConfigurationWizardScreen = importLazyComponent(() =>
  import('./ConfigurationWizard/ConfigurationWizardScreen.js').then(m => m.ConfigurationWizardScreen),
);

export class AdministrationScreenServiceBootstrapImpl extends Bootstrap {
  constructor(
    private readonly screenService: ScreenService,
    private readonly administrationScreenService: AdministrationScreenService,
    private readonly serverConfigResource: ServerConfigResource,
  ) {
    super();
  }

  override register(): void {
    const canActivate = () => this.administrationScreenService.handleCanActivate.bind(this.administrationScreenService);

    this.screenService.create({
      name: AdministrationScreenServiceImpl.screenName,
      routes: [
        {
          name: AdministrationScreenServiceImpl.screenName,
          path: '/admin',
          canActivate,
        },
        {
          name: AdministrationScreenServiceImpl.itemRouteName,
          path: '/:item',
          canActivate,
        },
        {
          name: AdministrationScreenServiceImpl.itemSubRouteName,
          path: '/:sub',
          canActivate,
        },
        {
          name: AdministrationScreenServiceImpl.itemSubParamRouteName,
          path: '/:param',
          canActivate,
        },
      ],
      component: AdministrationScreen,
      onActivate: this.administrationScreenService.handleActivate.bind(this.administrationScreenService),
      onDeactivate: this.administrationScreenService.handleDeactivate.bind(this.administrationScreenService),
      canDeActivate: this.administrationScreenService.handleCanDeActivate.bind(this.administrationScreenService),
    });

    this.screenService.create({
      name: AdministrationScreenServiceImpl.setupName,
      routes: [
        {
          name: AdministrationScreenServiceImpl.setupName,
          path: '/setup',
          canActivate,
        },
        {
          name: AdministrationScreenServiceImpl.setupItemRouteName,
          path: '/:item',
          canActivate,
        },
        {
          name: AdministrationScreenServiceImpl.setupItemSubRouteName,
          path: '/:sub',
          canActivate,
        },
        {
          name: AdministrationScreenServiceImpl.setupItemSubParamRouteName,
          path: '/:param',
          canActivate,
        },
      ],
      component: ConfigurationWizardScreen,
      onActivate: this.administrationScreenService.handleActivate.bind(this.administrationScreenService),
      onDeactivate: this.administrationScreenService.handleDeactivate.bind(this.administrationScreenService),
      canDeActivate: this.administrationScreenService.handleCanDeActivate.bind(this.administrationScreenService),
    });
  }

  override async load(): Promise<void> {
    await this.serverConfigResource.load();

    if (
      this.administrationScreenService.isConfigurationMode &&
      !this.screenService.isActive(this.screenService.routerService.route, AdministrationScreenServiceImpl.setupName)
    ) {
      this.administrationScreenService.navigateToRoot();
    }
  }
}

export type AdministrationScreenServiceBootstrap = AdministrationScreenServiceBootstrapImpl;

export class AdministrationScreenServiceBootstrapDI extends Context.Service<
  AdministrationScreenServiceBootstrapDI,
  AdministrationScreenServiceBootstrapImpl
>()('@cloudbeaver/plugin-administration/AdministrationScreen/AdministrationScreenServiceBootstrap#AdministrationScreenServiceBootstrap') {
  static readonly implementation = AdministrationScreenServiceBootstrapImpl;

  static readonly dependencies = () => [ScreenService, AdministrationScreenService, ServerConfigResource] as const;
  static readonly make: Effect.Effect<
    AdministrationScreenServiceBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof ScreenService>
    | Context.Service.Identifier<typeof AdministrationScreenService>
    | Context.Service.Identifier<typeof ServerConfigResource>
  > = Effect.gen(function* makeAdministrationScreenServiceBootstrap() {
    const screenService = yield* ScreenService;
    const administrationScreenService = yield* AdministrationScreenService;
    const serverConfigResource = yield* ServerConfigResource;

    return new AdministrationScreenServiceBootstrapImpl(screenService, administrationScreenService, serverConfigResource);
  });
  static readonly layer: Layer.Layer<
    AdministrationScreenServiceBootstrapDI,
    never,
    | Context.Service.Identifier<typeof ScreenService>
    | Context.Service.Identifier<typeof AdministrationScreenService>
    | Context.Service.Identifier<typeof ServerConfigResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AdministrationScreenServiceBootstrap = AdministrationScreenServiceBootstrapDI;
