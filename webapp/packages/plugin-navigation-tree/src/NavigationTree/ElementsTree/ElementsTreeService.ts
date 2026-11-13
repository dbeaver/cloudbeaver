/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { Executor, type IExecutor } from '@cloudbeaver/core-executor';

export interface IElementsTreeLoadData {
  nodeId: string;
  manual: boolean;
}

export class ElementsTreeServiceImpl {
  readonly onLoad: IExecutor<IElementsTreeLoadData>;

  constructor() {
    this.onLoad = new Executor();
  }
}

export type ElementsTreeService = ElementsTreeServiceImpl;

export class ElementsTreeServiceDI extends Context.Service<ElementsTreeServiceDI, ElementsTreeServiceImpl>()(
  '@cloudbeaver/plugin-navigation-tree/NavigationTree/ElementsTree/ElementsTreeService#ElementsTreeService',
) {
  static readonly implementation = ElementsTreeServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<ElementsTreeServiceImpl, never, never> = Effect.sync(() => new ElementsTreeServiceImpl());
  static readonly layer: Layer.Layer<ElementsTreeServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ElementsTreeService = ElementsTreeServiceDI;
