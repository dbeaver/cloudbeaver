/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ProjectsNavNodeService } from '@cloudbeaver/core-navigation-tree';

import { NAV_NODE_TYPE_RM_PROJECT } from './NAV_NODE_TYPE_RM_PROJECT.js';

const RM_PROJECT_PREFIX = 'rm';

export class PluginBootstrapImpl extends Bootstrap {
  constructor(private readonly projectsNavNodeService: ProjectsNavNodeService) {
    super();
  }

  override register(): void | Promise<void> {
    this.addRmProjectIds();
  }

  private addRmProjectIds() {
    this.projectsNavNodeService.addProjectType(NAV_NODE_TYPE_RM_PROJECT);
    this.projectsNavNodeService.addProjectPrefix(RM_PROJECT_PREFIX + '/');
  }
}

export type PluginBootstrap = PluginBootstrapImpl;

export class PluginBootstrapDI extends Context.Service<PluginBootstrapDI, PluginBootstrapImpl>()(
  '@cloudbeaver/core-resource-manager/PluginBootstrap#PluginBootstrap',
) {
  static readonly implementation = PluginBootstrapImpl;

  static readonly dependencies = () => [ProjectsNavNodeService] as const;
  static readonly make: Effect.Effect<PluginBootstrapImpl, never, Context.Service.Identifier<typeof ProjectsNavNodeService>> = Effect.gen(
    function* makePluginBootstrap() {
      const projectsNavNodeService = yield* ProjectsNavNodeService;

      return new PluginBootstrapImpl(projectsNavNodeService);
    },
  );
  static readonly layer: Layer.Layer<PluginBootstrapDI, never, Context.Service.Identifier<typeof ProjectsNavNodeService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const PluginBootstrap = PluginBootstrapDI;
