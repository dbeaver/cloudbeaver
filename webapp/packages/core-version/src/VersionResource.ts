/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable, observable, runInAction } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { CachedMapAllKey, CachedMapResource } from '@cloudbeaver/core-sdk';

export interface IVersion {
  number: string;
  date: string;
  releaseNotes: string;
}

interface IVersions {
  latestVersion?: string;
  versions?: IVersion[];
}

@injectable()
export class VersionResource extends CachedMapResource<string, IVersion> {
  private latestVersionNumber: string | null;

  get latest() {
    return this.values.find(v => v.number === this.latestVersionNumber);
  }

  constructor(
    private readonly serverConfigResource: ServerConfigResource
  ) {
    super();

    this.latestVersionNumber = null;
    this.preloadResource(this.serverConfigResource, () => {});

    makeObservable<this, 'latestVersionNumber'>(this, {
      latestVersionNumber: observable.ref,
      latest: computed,
    });
  }

  async refreshAll(): Promise<Map<string, IVersion>> {
    await this.refresh(CachedMapAllKey);
    return this.data;
  }

  protected async loader(): Promise<Map<string, IVersion>> {
    const versionLink = this.serverConfigResource.data?.productInfo.latestVersionInfo;
    if (!versionLink) {
      return this.data;
    }

    const response = await fetch(versionLink, {
      cache: 'no-cache',
    });

    const json = await response.json() as IVersions;

    if (json.latestVersion) {
      this.latestVersionNumber = json.latestVersion;
    }

    if (!json.versions) {
      return this.data;
    }

    runInAction(() => {
      this.data.clear();
      for (const version of json.versions!) {
        this.data.set(version.number, version);
      }
    });

    return this.data;
  }
}
