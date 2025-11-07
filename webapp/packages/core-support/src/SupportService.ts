/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

@injectable()
export class SupportService {
  supportInstruction: (() => React.FC) | null;

  constructor() {
    this.supportInstruction = null;
  }

  registerSupportInstruction(componentGetter: (() => React.FC) | null): void {
    this.supportInstruction = componentGetter;
  }
}
