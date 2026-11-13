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

const ProjectInfoForm = importLazyComponent(() => import('./ProjectInfoForm.js').then(m => m.ProjectInfoForm));
const panelGetter = () => ProjectInfoForm;

export class ProjectInfoOptionsPanelServiceImpl extends BaseOptionsPanelService<string | undefined> {
  constructor(optionsPanelService: OptionsPanelService) {
    super(optionsPanelService, panelGetter);
  }

  override open(tabId?: string): Promise<boolean> {
    return super.open(tabId);
  }
}

export type ProjectInfoOptionsPanelService = ProjectInfoOptionsPanelServiceImpl;

export class ProjectInfoOptionsPanelServiceDI extends Context.Service<ProjectInfoOptionsPanelServiceDI, ProjectInfoOptionsPanelServiceImpl>()(
  '@cloudbeaver/plugin-project-info/ProjectInfoForm/ProjectInfoOptionsPanelService#ProjectInfoOptionsPanelService',
) {
  static readonly implementation = ProjectInfoOptionsPanelServiceImpl;

  static readonly dependencies = () => [OptionsPanelService] as const;
  static readonly make: Effect.Effect<ProjectInfoOptionsPanelServiceImpl, never, Context.Service.Identifier<typeof OptionsPanelService>> = Effect.gen(
    function* makeProjectInfoOptionsPanelService() {
      const optionsPanelService = yield* OptionsPanelService;

      return new ProjectInfoOptionsPanelServiceImpl(optionsPanelService);
    },
  );
  static readonly layer: Layer.Layer<ProjectInfoOptionsPanelServiceDI, never, Context.Service.Identifier<typeof OptionsPanelService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ProjectInfoOptionsPanelService = ProjectInfoOptionsPanelServiceDI;
