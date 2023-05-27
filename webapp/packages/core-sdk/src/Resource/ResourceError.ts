/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { LoadingError } from '@cloudbeaver/core-utils';

import type { CachedResource } from './CachedResource';

export class ResourceError extends LoadingError {
  constructor(
    private readonly resource: CachedResource<any, any, any, any, any>,
    private readonly key: any,
    private readonly context: any,
    message?: string,
    options?: ErrorOptions,
  ) {
    super(
      () => {
        this.resource.markOutdated(this.key);
      },
      message,
      options,
    );
    this.name = 'Resource Error';
  }
}
