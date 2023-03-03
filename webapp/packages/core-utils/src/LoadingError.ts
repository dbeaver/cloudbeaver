/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { InheritableError } from './InheritableError';

export class LoadingError extends InheritableError {
  constructor(
    public refresh: () => void,
    inherit?: Error,
    message?: string,
  ) {
    super(inherit, message);
    this.name = 'Loading Error';
    this.refresh = this.refresh.bind(this);
  }
}
