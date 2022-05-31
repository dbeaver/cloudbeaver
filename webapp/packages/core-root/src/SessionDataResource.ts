/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-sdk';

import { SessionResource } from './SessionResource';

@injectable()
export class SessionDataResource extends CachedDataResource<null> {
  constructor(
    sessionResource: SessionResource
  ) {
    super(null);

    this.sync(sessionResource, () => {}, () => {});
  }

  protected async loader(): Promise<null> {
    return null;
  }
}
