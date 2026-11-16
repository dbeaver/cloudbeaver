/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { BaseOptionsPanelService, OptionsPanelService } from '@cloudbeaver/core-ui';

const TeamsTableOptionsPanel = importLazyComponent(() => import('./TeamsTableOptionsPanel.js').then(m => m.TeamsTableOptionsPanel));
const panelGetter = () => TeamsTableOptionsPanel;

export class TeamsTableOptionsPanelServiceImpl extends BaseOptionsPanelService<string> {
  constructor(optionsPanelService: OptionsPanelService) {
    super(optionsPanelService, panelGetter);
  }
}

export type TeamsTableOptionsPanelService = TeamsTableOptionsPanelServiceImpl;

export class TeamsTableOptionsPanelServiceDI extends Context.Service<TeamsTableOptionsPanelServiceDI, TeamsTableOptionsPanelServiceImpl>()(
  '@cloudbeaver/plugin-authentication-administration/Administration/Users/Teams/TeamsTable/TeamsTableOptionsPanelService#TeamsTableOptionsPanelService',
) {
  static readonly implementation = TeamsTableOptionsPanelServiceImpl;

  static readonly dependencies = () => [OptionsPanelService] as const;
  static readonly make: Effect.Effect<TeamsTableOptionsPanelServiceImpl, never, Context.Service.Identifier<typeof OptionsPanelService>> = Effect.gen(
    function* makeTeamsTableOptionsPanelService() {
      const optionsPanelService = yield* OptionsPanelService;

      return new TeamsTableOptionsPanelServiceImpl(optionsPanelService);
    },
  );
  static readonly layer: Layer.Layer<TeamsTableOptionsPanelServiceDI, never, Context.Service.Identifier<typeof OptionsPanelService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const TeamsTableOptionsPanelService = TeamsTableOptionsPanelServiceDI;
