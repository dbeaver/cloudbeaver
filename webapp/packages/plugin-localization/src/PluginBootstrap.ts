/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { DATA_CONTEXT_MENU, MenuBaseItem, MenuService } from '@cloudbeaver/core-view';
import { TOP_NAV_BAR_SETTINGS_MENU } from '@cloudbeaver/plugin-settings-menu';

import { LOCALIZATION_MENU } from './LOCALIZATION_MENU';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly localizationService: LocalizationService,
    private readonly menuService: MenuService,
    private readonly serverConfigResource: ServerConfigResource
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.menuService.setHandler({
      id: 'localization-menu',
      isApplicable: context => context.get(DATA_CONTEXT_MENU) === LOCALIZATION_MENU,
      isLoading: () => this.serverConfigResource.isLoading(),
      handler: () => this.serverConfigResource.load(),
    });

    this.menuService.addCreator({
      isApplicable: context => (
        context.get(DATA_CONTEXT_MENU) === TOP_NAV_BAR_SETTINGS_MENU
        && !!this.serverConfigResource.data?.supportedLanguages.length
      ),
      getItems(context, items) {
        return [
          ...items,
          LOCALIZATION_MENU,
        ];
      },
    });

    this.menuService.addCreator({
      isApplicable: context => context.get(DATA_CONTEXT_MENU) === LOCALIZATION_MENU,
      getItems: (context, items) => {
        const supportedLanguages = this.serverConfigResource.data?.supportedLanguages;

        if (!supportedLanguages?.length) {
          return items;
        }

        const languages = supportedLanguages.map(lang => {
          const label = lang.nativeName || lang.isoCode;

          return new MenuBaseItem(
            {
              id: lang.isoCode,
              label,
              tooltip: label,
            },
            { onSelect: () => this.localizationService.changeLocaleAsync(lang.isoCode) },
            { isDisabled: () => this.localizationService.getCurrentLanguage() === lang.isoCode }
          );
        });

        return [
          ...items,
          ...languages,
        ];
      },
    });
  }

  load(): void | Promise<void> { }
}