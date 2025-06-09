/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Icon, Placeholder, TextPlaceholder, usePlaceholder, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { observer } from 'mobx-react-lite';
import { NavigationTabsService } from '../NavigationTabsService.js';

export const NavigationWelcomeScreen = observer(function NavigationWelcomeScreen() {
  const navigationTabsService = useService(NavigationTabsService);
  const translate = useTranslate();
  const elements = usePlaceholder({
    container: navigationTabsService.welcomeContainer,
    props: {},
  });

  return (
    <div className="tw:flex tw:flex-col tw:h-full tw:w-full tw:relative tw:pl-6 tw:pt-8 tw:lg:pl-12 tw:lg:pt-16">
      <div className="tw:absolute tw:inset-0 tw:overflow-hidden tw:flex tw:items-center tw:justify-center">
        <Icon name="/icons/logo_current_sm.svg" className="tw:w-64 tw:h-64 tw:opacity-5" viewBox="0 0 24 24" />
      </div>
      <div className="tw:relative tw:flex tw:flex-col tw:mb-8">
        <div className="tw:text-xl tw:font-semibold tw:text-left">{translate('product_full_name')}</div>
      </div>
      {elements.length && (
        <div className="tw:relative">
          <h2 className="tw:text-lg tw:font-semibold tw:mb-4">{translate('plugin_navigation_tabs_welcome_start')}</h2>
          <div className="tw:grid tw:grid-cols-[repeat(auto-fit,minmax(150px,300px))] tw:gap-2">
            <Placeholder
              container={navigationTabsService.welcomeContainer}
              empty={<TextPlaceholder>{translate('app_shared_navigationTabsBar_placeholder')}</TextPlaceholder>}
            />
          </div>
        </div>
      )}
    </div>
  );
});
