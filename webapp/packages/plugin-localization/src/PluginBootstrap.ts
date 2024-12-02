/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { autorun, type IReactionDisposer } from 'mobx';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { schemaExtra } from '@cloudbeaver/core-utils';

@injectable()
export class PluginBootstrap extends Bootstrap {
  private reactionDisposer: IReactionDisposer | null;
  constructor(private readonly localizationService: LocalizationService) {
    super();
    this.reactionDisposer = null;
  }

  override register(): void {
    this.reactionDisposer = autorun(() => schemaExtra.setLocale(this.localizationService.currentLanguage));
    this.localizationService.addProvider(async locale => {
      await schemaExtra.loadLocale(locale);
      return [];
    });
  }

  override dispose(): void {
    this.reactionDisposer?.();
  }
}
