/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ACTION_COLLAPSE_ALL, AppView } from '@cloudbeaver/core-view';

export class TreeViewServiceImpl extends AppView {
  constructor() {
    super();
    this.registerAction(ACTION_COLLAPSE_ALL);
  }
}

export type TreeViewService = TreeViewServiceImpl;

export class TreeViewServiceDI extends Context.Service<TreeViewServiceDI, TreeViewServiceImpl>()(
  '@cloudbeaver/plugin-navigation-tree/TreeNew/TreeViewService#TreeViewService',
) {
  static readonly implementation = TreeViewServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<TreeViewServiceImpl, never, never> = Effect.sync(() => new TreeViewServiceImpl());
  static readonly layer: Layer.Layer<TreeViewServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const TreeViewService = TreeViewServiceDI;
