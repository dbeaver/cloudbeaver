/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DetailsError } from './DetailsError';
import type { ServerError } from './sdk';

export class ServerInternalError extends DetailsError implements ServerError {
  readonly errorCode?: string;
  readonly stackTrace?: string;
  readonly causedBy?: ServerError;

  constructor(error: ServerError) {
    super(error.message);
    this.name = 'Server Internal Error';
    this.errorCode = error.errorCode;
    this.stackTrace = error.stackTrace;
    this.causedBy = error.causedBy;
  }

  hasDetails(): boolean {
    return this.stackTrace !== undefined && this.stackTrace.length > 0;
  }
}
