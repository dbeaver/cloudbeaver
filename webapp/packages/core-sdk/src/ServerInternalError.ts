/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { DetailsError } from './DetailsError.js';
import type { ServerError } from './sdk.js';

export enum ServerErrorType {
  'QUOTE_EXCEEDED' = 'quotaExceeded',
}

export class ServerInternalError extends DetailsError implements ServerError {
  readonly errorCode?: string;
  readonly errorType?: ServerErrorType;
  readonly causedBy?: ServerError;

  constructor(error: ServerError) {
    super(error.message);
    this.name = 'Server Internal Error';
    this.stack = error.stackTrace;
    this.errorCode = error.errorCode;
    this.errorType = error.errorType as ServerErrorType;
    this.causedBy = error.causedBy;
  }

  override hasDetails(): boolean {
    return this.stack !== undefined && this.stack.length > 0 && this.errorType !== ServerErrorType.QUOTE_EXCEEDED;
  }
}
