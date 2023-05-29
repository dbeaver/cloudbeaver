/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function executionExceptionContext() {
  return {
    exception: null as null | Error,
    setException(exception: Error) {
      this.exception = exception;
    },
  };
}
