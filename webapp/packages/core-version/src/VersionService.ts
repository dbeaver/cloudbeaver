/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { GlobalConstants } from '@cloudbeaver/core-utils';

import { compareProductVersions, parseProductVersion } from './productVersion.js';

const VERSION_REGEX = /(\d+\.\d+\.\d+)/;

export interface IProductVersion {
  frontendVersion: string;
  backendVersion: string;
}

@injectable(() => [ServerConfigResource])
export class VersionService {
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
      frontendVersion = parseProductVersion(frontendVersion)?.release ?? VERSION_REGEX.exec(frontendVersion)?.[1] ?? frontendVersion;
      backendVersion = parseProductVersion(backendVersion)?.release ?? VERSION_REGEX.exec(backendVersion)?.[1] ?? backendVersion;
    }

    return {
      frontendVersion,
      backendVersion,
    };
  }

  greaterOrEqual(v1: string, v2: string) {
    return this.compareVersions(v1, v2) >= 0;
  }

  parseVersion(version: string) {
    return parseProductVersion(version)?.base ?? null;
  }

  isHotfix(version: string): boolean {
    return (parseProductVersion(version)?.hotfixVersion ?? 0) > 0;
  }

  compareVersions(v1: string, v2: string): number {
    return compareProductVersions(v1, v2);
  }
}
