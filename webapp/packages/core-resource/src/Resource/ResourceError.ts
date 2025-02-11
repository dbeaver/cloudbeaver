/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action } from 'mobx';

import { LoadingError } from '@cloudbeaver/core-utils';

import type { CachedResource } from './CachedResource.js';

export class ResourceError extends LoadingError {
  constructor(
    private readonly resource: CachedResource<any, any, any, any, any>,
    private readonly key: any,
    message?: string,
    options?: ErrorOptions,
  ) {
    super(
      action(() => {
        // @TODO extract clean error logic to the CachedResource.
        // For now when the ResourceError is thrown and refresh fn is called, the error is not cleaned in the resource
        this.resource.cleanError(this.key);
        this.resource.markOutdated(this.key);
      }),
      message,
      options,
    );
    this.name = 'Resource Error';
  }
}
