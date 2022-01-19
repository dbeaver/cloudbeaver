/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export abstract class DetailsError extends Error {
  errorMessage: string;
  constructor(message?: string) {
    super(message);
    this.name = 'Details Error';
    this.errorMessage = message || 'Error';
  }

  abstract hasDetails(): boolean;
}
