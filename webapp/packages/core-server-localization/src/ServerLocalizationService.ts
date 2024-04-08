/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ServerConfigResource } from '@cloudbeaver/core-root';

@injectable()
export class ServerLocalizationService extends Dependency {
  constructor(
    private readonly serverConfigResource: ServerConfigResource,
    private readonly localizationService: LocalizationService,
  ) {
    super();

    this.serverConfigResource.onDataUpdate.addHandler(this.updateSupportedLocalization.bind(this));
  }

  private updateSupportedLocalization() {
    const supportedLanguages = this.serverConfigResource.data?.supportedLanguages;

    if (supportedLanguages) {
      this.localizationService.setSupportedLanguages(
        supportedLanguages.map(lang => ({
          isoCode: lang.isoCode,
          name: lang.displayName ?? lang.isoCode,
          nativeName: lang.nativeName,
        })),
      );
    }
  }
}
