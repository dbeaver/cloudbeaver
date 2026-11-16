/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ResourceManagerResource } from '@cloudbeaver/core-resource-manager';

import { getResourceNodeId } from './NavNodes/getResourceNodeId.js';

export class NavResourceNodeServiceImpl {
  constructor(private readonly resourceManagerResource: ResourceManagerResource) {}

  async move(key: string, newKey: string): Promise<string> {
    await this.resourceManagerResource.move(key, newKey);

    return getResourceNodeId(newKey);
  }

  async read(key: string): Promise<string> {
    return await this.resourceManagerResource.readText(key);
  }

  async write(key: string, value: string) {
    await this.resourceManagerResource.writeText(key, value, true);
  }

  async setProperties(key: string, diff: Record<string, any>): Promise<Record<string, any>> {
    return await this.resourceManagerResource.setProperties(key, diff);
  }
}

export type NavResourceNodeService = NavResourceNodeServiceImpl;

export class NavResourceNodeServiceDI extends Context.Service<NavResourceNodeServiceDI, NavResourceNodeServiceImpl>()(
  '@cloudbeaver/plugin-navigation-tree-rm/NavResourceNodeService#NavResourceNodeService',
) {
  static readonly implementation = NavResourceNodeServiceImpl;

  static readonly dependencies = () => [ResourceManagerResource] as const;
  static readonly make: Effect.Effect<NavResourceNodeServiceImpl, never, Context.Service.Identifier<typeof ResourceManagerResource>> = Effect.gen(
    function* makeNavResourceNodeService() {
      const resourceManagerResource = yield* ResourceManagerResource;

      return new NavResourceNodeServiceImpl(resourceManagerResource);
    },
  );
  static readonly layer: Layer.Layer<NavResourceNodeServiceDI, never, Context.Service.Identifier<typeof ResourceManagerResource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const NavResourceNodeService = NavResourceNodeServiceDI;
