/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ServerError } from './sdk';

export class ServerInternalError extends Error implements ServerError {
  readonly errorCode?: string;
  readonly stackTrace?: string;
  readonly causedBy?: ServerError;

  constructor(error: ServerError) {
    super(error.message);
    this.errorCode = error.errorCode;
    this.stackTrace = error.stackTrace;
    this.causedBy = error.causedBy;
  }
}
