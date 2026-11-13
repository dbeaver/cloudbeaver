/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';
import { compare, gte, parse } from 'semver';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { GlobalConstants } from '@cloudbeaver/core-utils';

const VERSION_REGEX = /(\d+\.\d+\.\d+)/;

export interface IProductVersion {
  frontendVersion: string;
  backendVersion: string;
}

export class VersionServiceImpl {
  get current(): string {
    return this.getProductVersion(true).frontendVersion;
  }

  constructor(private readonly serverConfigResource: ServerConfigResource) {
    makeObservable(this, {
      current: computed,
    });
  }

  getProductVersion(short = false): IProductVersion {
    let frontendVersion = GlobalConstants.version || '';
    let backendVersion = this.serverConfigResource.data?.version || '';

    if (short) {
      frontendVersion = VERSION_REGEX.exec(frontendVersion)?.[1] ?? frontendVersion;
      backendVersion = VERSION_REGEX.exec(backendVersion)?.[1] ?? backendVersion;
    }

    return {
      frontendVersion,
      backendVersion,
    };
  }

  greaterOrEqual(v1: string, v2: string) {
    return gte(v1, v2);
  }

  parseVersion(version: string) {
    return parse(version);
  }

  compareVersions(v1: string, v2: string): number {
    return compare(v1, v2);
  }
}

export type VersionService = VersionServiceImpl;

export class VersionServiceDI extends Context.Service<VersionServiceDI, VersionServiceImpl>()(
  '@cloudbeaver/core-version/VersionService#VersionService',
) {
  static readonly implementation = VersionServiceImpl;

  static readonly dependencies = () => [ServerConfigResource] as const;
  static readonly make: Effect.Effect<VersionServiceImpl, never, Context.Service.Identifier<typeof ServerConfigResource>> = Effect.gen(
    function* makeVersionService() {
      const serverConfigResource = yield* ServerConfigResource;

      return new VersionServiceImpl(serverConfigResource);
    },
  );
  static readonly layer: Layer.Layer<VersionServiceDI, never, Context.Service.Identifier<typeof ServerConfigResource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const VersionService = VersionServiceDI;
