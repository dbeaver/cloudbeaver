/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import type { ISettingsSource } from '@cloudbeaver/core-settings';

import { ServerSettingsResolverService } from './ServerSettingsResolverService';

@injectable()
export class SessionSettingsService implements ISettingsSource {
  constructor(private readonly serverSettingsResolverService: ServerSettingsResolverService) {}

  has(key: any): boolean {
    return this.serverSettingsResolverService.has(key);
  }

  isReadOnly(key: any): boolean {
    return true;
  }

  getDefaultValue(key: any): any {
    return this.serverSettingsResolverService.getDefaultValue(key);
  }

  getValue(key: any): any {
    return this.serverSettingsResolverService.getValue(key);
  }
  setValue(key: any, value: any): void {
    throw new Error('Method not implemented.');
  }
  clear(): void {
    throw new Error('Method not implemented.');
  }
}
