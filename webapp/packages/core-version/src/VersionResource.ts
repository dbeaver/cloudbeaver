/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable, runInAction } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { CachedMapResource } from '@cloudbeaver/core-sdk';

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
  latest: string | null;
  constructor(
    private readonly serverConfigResource: ServerConfigResource
  ) {
    super();

    this.latest = null;
    this.preloadResource(this.serverConfigResource);

    makeObservable(this, {
      latest: observable.ref,
    });
  }

  protected async loader(): Promise<Map<string, IVersion>> {
    const versionLink = this.serverConfigResource.data?.productInfo.latestVersionInfo;
    if (!versionLink) {
      return this.data;
    }

    // https://www.npoint.io/docs/20ec48e3408c7e3543dc
    const response = await fetch('https://api.npoint.io/20ec48e3408c7e3543dc', {
      cache: 'no-cache',
    });

    const json = await response.json() as IVersions;

    if (json.latestVersion) {
      this.latest = json.latestVersion;
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
