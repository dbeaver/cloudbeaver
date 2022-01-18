/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { ServerService } from '@cloudbeaver/core-root';
import { GlobalConstants } from '@cloudbeaver/core-utils';

const VERSION_REGEX = /(\d+\.\d+\.\d+)/;

export interface IProductVersion {
  frontendVersion: string;
  backendVersion: string;
}

@injectable()
export class VersionService {
  get current(): string {
    return this.getProductVersion(true).frontendVersion;
  }

  constructor(
    private readonly serverService: ServerService,
  ) {
    makeObservable(this, {
      current: computed,
    });
  }

  getProductVersion(short = false): IProductVersion {
    let frontendVersion = GlobalConstants.version || '';
    let backendVersion = this.serverService.config.data?.version || '';

    if (short) {
      frontendVersion = VERSION_REGEX.exec(frontendVersion)?.[1] ?? frontendVersion;
      backendVersion = VERSION_REGEX.exec(backendVersion)?.[1] ?? backendVersion;
    }

    return {
      frontendVersion,
      backendVersion,
    };
  }
}
