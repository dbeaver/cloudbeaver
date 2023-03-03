
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { InheritableError } from '@cloudbeaver/core-utils';

export class NetworkError extends InheritableError {
  constructor(error?: Error, message?: string) {
    super(error, message);
    this.name = 'Network Error';
  }
}
