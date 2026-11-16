/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { ObjectPropertiesPageService } from './ObjectPropertiesPage/ObjectPropertiesPageService.js';
import { ObjectPropertyTableFooterService } from './ObjectPropertiesPage/ObjectPropertyTable/ObjectPropertyTableFooterService.js';
import { ObjectViewerTabService } from './ObjectViewerTabService.js';

export class ObjectViewerBootstrapImpl extends Bootstrap {
  constructor(
    private readonly objectViewerTabService: ObjectViewerTabService,
    private readonly objectPropertiesPageService: ObjectPropertiesPageService,
    private readonly objectPropertyTableFooterService: ObjectPropertyTableFooterService,
  ) {
    super();
  }

  override register(): void {
    this.objectViewerTabService.registerTabHandler();
    this.objectPropertiesPageService.registerDBObjectPage();
    this.objectPropertyTableFooterService.registerFooterActions();
  }
}

export type ObjectViewerBootstrap = ObjectViewerBootstrapImpl;

export class ObjectViewerBootstrapDI extends Context.Service<ObjectViewerBootstrapDI, ObjectViewerBootstrapImpl>()(
  '@cloudbeaver/plugin-object-viewer/ObjectViewerBootstrap#ObjectViewerBootstrap',
) {
  static readonly implementation = ObjectViewerBootstrapImpl;

  static readonly dependencies = () => [ObjectViewerTabService, ObjectPropertiesPageService, ObjectPropertyTableFooterService] as const;
  static readonly make: Effect.Effect<
    ObjectViewerBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof ObjectViewerTabService>
    | Context.Service.Identifier<typeof ObjectPropertiesPageService>
    | Context.Service.Identifier<typeof ObjectPropertyTableFooterService>
  > = Effect.gen(function* makeObjectViewerBootstrap() {
    const objectViewerTabService = yield* ObjectViewerTabService;
    const objectPropertiesPageService = yield* ObjectPropertiesPageService;
    const objectPropertyTableFooterService = yield* ObjectPropertyTableFooterService;

    return new ObjectViewerBootstrapImpl(objectViewerTabService, objectPropertiesPageService, objectPropertyTableFooterService);
  });
  static readonly layer: Layer.Layer<
    ObjectViewerBootstrapDI,
    never,
    | Context.Service.Identifier<typeof ObjectViewerTabService>
    | Context.Service.Identifier<typeof ObjectPropertiesPageService>
    | Context.Service.Identifier<typeof ObjectPropertyTableFooterService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ObjectViewerBootstrap = ObjectViewerBootstrapDI;
