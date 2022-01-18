/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DetailsError } from './DetailsError';
import type { ServerError } from './sdk';

export enum ServerErrorType {
  'QUOTE_EXCEEDED' = 'quotaExceeded'
}

export class ServerInternalError extends DetailsError implements ServerError {
  readonly errorCode?: string;
  readonly errorType?: ServerErrorType;
  readonly stackTrace?: string;
  readonly causedBy?: ServerError;

  constructor(error: ServerError) {
    super(error.message);
    this.name = 'Server Internal Error';
    this.errorCode = error.errorCode;
    this.errorType = error.errorType as ServerErrorType;
    this.stackTrace = error.stackTrace;
    this.causedBy = error.causedBy;
  }

  hasDetails(): boolean {
    return this.stackTrace !== undefined && this.stackTrace.length > 0;
  }
}
