/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { CachedMapResource, resourceKeyList } from '@cloudbeaver/core-resource';
import { ProductInfoResource } from '@cloudbeaver/core-root';

import { compareProductVersions } from './productVersion.js';
import { getVersionReleaseNotes, normalizeVersions } from './versionMetadata.js';

export interface IVersion {
  number: string;
  date: string;
  releaseNotes: string;
  patches?: { patchNumber: number; releaseNotes: string }[];
}

interface IVersions {
  latestVersion?: string;
  versions?: IVersion[];
}

@injectable(() => [ProductInfoResource])
export class VersionResource extends CachedMapResource<string, IVersion> {
  get latest(): IVersion | undefined {
    return this.values.slice().sort((a, b) => compareProductVersions(b.number, a.number))[0];
  }

  constructor(private readonly productInfoResource: ProductInfoResource) {
    super();

    this.preloadResource(this.productInfoResource, () => {});

    makeObservable(this, {
      latest: computed,
    });
  }

  getReleaseNotes(number: string): IVersion[] {
    return getVersionReleaseNotes(this.values, number);
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

      const json = (await response.json()) as IVersions | null;

      if (!Array.isArray(json?.versions)) {
        return this.data;
      }

      const versions = normalizeVersions(json.versions);
      this.replace(resourceKeyList(versions.map(version => version.number)), versions);
    } catch (exception: any) {
      throw new Error('versions_load_fail', { cause: exception });
    }

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}
