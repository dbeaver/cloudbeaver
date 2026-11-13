/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { ProjectInfoFormService } from '../ProjectInfoFormService.js';
import { ProjectInfoFormOptions } from './ProjectInfoFormOptions.js';

export class ProjectInfoFormOptionsTabBootstrapImpl extends Bootstrap {
  constructor(private readonly projectInfoFormService: ProjectInfoFormService) {
    super();
  }

  override register(): void {
    this.projectInfoFormService.parts.add({
      key: 'options',
      name: 'plugin_project_info_form_tab_options',
      order: 1,
      panel: () => ProjectInfoFormOptions,
    });
  }
}

export type ProjectInfoFormOptionsTabBootstrap = ProjectInfoFormOptionsTabBootstrapImpl;

export class ProjectInfoFormOptionsTabBootstrapDI extends Context.Service<
  ProjectInfoFormOptionsTabBootstrapDI,
  ProjectInfoFormOptionsTabBootstrapImpl
>()('@cloudbeaver/plugin-project-info/ProjectInfoForm/Options/ProjectInfoFormOptionsTabBootstrap#ProjectInfoFormOptionsTabBootstrap') {
  static readonly implementation = ProjectInfoFormOptionsTabBootstrapImpl;

  static readonly dependencies = () => [ProjectInfoFormService] as const;
  static readonly make: Effect.Effect<ProjectInfoFormOptionsTabBootstrapImpl, never, Context.Service.Identifier<typeof ProjectInfoFormService>> =
    Effect.gen(function* makeProjectInfoFormOptionsTabBootstrap() {
      const projectInfoFormService = yield* ProjectInfoFormService;

      return new ProjectInfoFormOptionsTabBootstrapImpl(projectInfoFormService);
    });
  static readonly layer: Layer.Layer<ProjectInfoFormOptionsTabBootstrapDI, never, Context.Service.Identifier<typeof ProjectInfoFormService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const ProjectInfoFormOptionsTabBootstrap = ProjectInfoFormOptionsTabBootstrapDI;
