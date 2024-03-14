/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { SessionResource } from '@cloudbeaver/core-root';

@injectable()
export class SessionLocalizationService extends Dependency {
  constructor(
    private readonly sessionResource: SessionResource,
    private readonly localizationService: LocalizationService,
  ) {
    super();

    this.sessionResource.onDataUpdate.addHandler(this.syncLanguage.bind(this));
    this.localizationService.onChange.addHandler(language => this.sessionResource.changeLanguage(language));
  }

  private async syncLanguage() {
    const session = this.sessionResource.data;

    if (session) {
      await this.localizationService.changeLocale(session.locale);
    }
  }
}
