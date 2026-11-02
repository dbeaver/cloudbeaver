/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { PRODUCT_SETTINGS_LAYER, ProductSettingsService } from '@cloudbeaver/core-product';
import { SERVER_SETTINGS_LAYER, ServerDefaultSettingsService, ServerSettingsService } from '@cloudbeaver/core-root';
import { EditableSettingsSource, ROOT_SETTINGS_LAYER, SettingsProviderService, SettingsResolverSource } from '@cloudbeaver/core-settings';
import { schemaValidationError } from '@cloudbeaver/core-utils';

@injectable(() => [ServerSettingsService, ServerDefaultSettingsService, ProductSettingsService, SettingsProviderService])
export class ConfigurationSettingsService extends EditableSettingsSource {
  readonly resolver: SettingsResolverSource;

  constructor(
    private readonly serverSettingsService: ServerSettingsService,
    serverDefaultSettingsService: ServerDefaultSettingsService,
    productSettingsService: ProductSettingsService,
    private readonly settingsProviderService: SettingsProviderService,
  ) {
    super();
    this.resolver = new SettingsResolverSource();
    this.resolver.addResolver(ROOT_SETTINGS_LAYER, serverDefaultSettingsService);
    this.resolver.addResolver(PRODUCT_SETTINGS_LAYER, productSettingsService);
    this.resolver.addResolver(SERVER_SETTINGS_LAYER, this);
  }

  override has(key: string): boolean {
    return super.has(key) || this.serverSettingsService.has(key);
  }

  getValue(key: string): unknown {
    return this.serverSettingsService.getValue(key);
  }

  isReadOnly(): boolean {
    return false;
  }

  save(): Promise<void> {
    // The wizard submits this draft together with the server configuration.
    return Promise.resolve();
  }

  getChanges(): Record<string, unknown> {
    return Object.fromEntries(this.changes);
  }

  validate(): string | null {
    for (const [key, value] of this.changes) {
      const settingSchema = this.settingsProviderService.schema.shape[key];

      if (value === null || !settingSchema) {
        continue;
      }

      const result = settingSchema.safeParse(value);

      if (!result.success) {
        return schemaValidationError(result.error, { prefix: key }).toString();
      }
    }

    return null;
  }

  protected getSnapshot(): Record<string, unknown> {
    return this.getChanges();
  }
}
