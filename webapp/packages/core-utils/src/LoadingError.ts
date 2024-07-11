/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export class LoadingError extends Error {
  constructor(
    private readonly onRefresh: () => void,
    message?: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'Loading Error';
    this.refresh = this.refresh.bind(this);
  }

  refresh() {
    this.onRefresh();
    let cause = this.cause;

    while (cause) {
      if (cause instanceof LoadingError) {
        cause.refresh();
        return;
      }

      if (cause instanceof Error) {
        cause = cause.cause;
      } else {
        return;
      }
    }
  }
}
