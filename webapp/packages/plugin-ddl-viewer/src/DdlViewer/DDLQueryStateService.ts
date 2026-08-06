/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { MetadataMap } from '@cloudbeaver/core-utils';

@injectable()
export class DDLQueryStateService {
  private readonly fullDdlState = new MetadataMap<string, boolean>(() => false);

  isFullDdlEnabled(nodeId: string): boolean {
    return this.fullDdlState.get(nodeId);
  }

  setFullDdlEnabled(nodeId: string, value: boolean): void {
    this.fullDdlState.set(nodeId, value);
  }

  toggleFullDdl(nodeId: string): void {
    this.setFullDdlEnabled(nodeId, !this.isFullDdlEnabled(nodeId));
  }
}
