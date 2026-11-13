/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, observable } from 'mobx';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedMapResource, resourceKeyList } from '@cloudbeaver/core-resource';
import { ProductInfoResource } from '@cloudbeaver/core-root';

export interface IVersion {
  number: string;
  date: string;
  releaseNotes: string;
}

interface IVersions {
  latestVersion?: string;
  versions?: IVersion[];
}

export class VersionResourceImpl extends CachedMapResource<string, IVersion> {
  private latestVersionNumber: string | null;

  get latest() {
    return this.values.find(v => v.number === this.latestVersionNumber);
  }

  constructor(private readonly productInfoResource: ProductInfoResource) {
    super();

    this.latestVersionNumber = null;
    this.preloadResource(this.productInfoResource, () => {});

    makeObservable<this, 'latestVersionNumber'>(this, {
      latestVersionNumber: observable.ref,
      latest: computed,
    });
  }

  protected async loader(): Promise<Map<string, IVersion>> {
    const versionLink = this.productInfoResource.data?.latestVersionInfo;

    if (!versionLink) {
      return this.data;
    }

    try {
      const response = await fetch(versionLink, {
        cache: 'no-cache',
      });

      const json = (await response.json()) as IVersions;

      if (json.latestVersion) {
        this.latestVersionNumber = json.latestVersion;
      }

      if (!json.versions) {
        return this.data;
      }

      this.replace(resourceKeyList(json.versions.map(version => version.number)), json.versions);
    } catch (exception: any) {
      throw new Error('versions_load_fail', { cause: exception });
    }

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}

export type VersionResource = VersionResourceImpl;

export class VersionResourceDI extends Context.Service<VersionResourceDI, VersionResourceImpl>()(
  '@cloudbeaver/core-version/VersionResource#VersionResource',
) {
  static readonly implementation = VersionResourceImpl;

  static readonly dependencies = () => [ProductInfoResource] as const;
  static readonly make: Effect.Effect<VersionResourceImpl, never, Context.Service.Identifier<typeof ProductInfoResource>> = Effect.gen(
    function* makeVersionResource() {
      const productInfoResource = yield* ProductInfoResource;

      return new VersionResourceImpl(productInfoResource);
    },
  );
  static readonly layer: Layer.Layer<VersionResourceDI, never, Context.Service.Identifier<typeof ProductInfoResource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const VersionResource = VersionResourceDI;
