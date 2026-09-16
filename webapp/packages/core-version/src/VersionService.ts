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

const PRODUCT_VERSION_REGEX = /^(\d+)\.(\d+)\.(\d+)(?:\.(\d+))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

export interface IProductVersion {
  frontendVersion: string;
  backendVersion: string;
}

export interface IParsedProductVersion {
  major: number;
  minor: number;
  patch: number;
  revision: number | null;
  buildMetadata: string | null;
  version: string;
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
      frontendVersion = this.parseVersion(frontendVersion)?.version ?? frontendVersion;
      backendVersion = this.parseVersion(backendVersion)?.version ?? backendVersion;
    }

    return {
      frontendVersion,
      backendVersion,
    };
  }

  greaterOrEqual(v1: string, v2: string): boolean {
    return this.compareVersions(v1, v2) >= 0;
  }

  parseVersion(version: string): IParsedProductVersion | null {
    const match = PRODUCT_VERSION_REGEX.exec(version);

    if (!match) {
      return null;
    }

    const major = Number(match[1]);
    const minor = Number(match[2]);
    const patch = Number(match[3]);
    const revision = match[4] === undefined ? null : Number(match[4]);

    if (![major, minor, patch, revision].every(component => component === null || Number.isSafeInteger(component))) {
      return null;
    }

    return {
      major,
      minor,
      patch,
      revision,
      buildMetadata: match[5] ?? null,
      version: version.split('+', 1)[0]!,
    };
  }

  compareVersions(v1: string, v2: string): number {
    const first = this.parseVersion(v1);
    const second = this.parseVersion(v2);

    if (!first || !second) {
      throw new TypeError(`Invalid product version: ${!first ? v1 : v2}`);
    }

    const firstComponents = [first.major, first.minor, first.patch, first.revision ?? 0];
    const secondComponents = [second.major, second.minor, second.patch, second.revision ?? 0];

    for (let i = 0; i < firstComponents.length; i++) {
      if (firstComponents[i]! > secondComponents[i]!) {
        return 1;
      }

      if (firstComponents[i]! < secondComponents[i]!) {
        return -1;
      }
    }

    return 0;
  }
}
