/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { isDefined, isNotNullDefined } from '@dbeaver/js-helpers';

import { TabsContext } from './TabsContext.js';
import { TabsValidationContext } from './TabsValidationContext.js';

export const TabsValidationProvider = observer(function TabsValidation({ children }: React.PropsWithChildren) {
  const tabsContext = useContext(TabsContext);
  const notificationService = useService(NotificationService);

  if (!tabsContext) {
    throw new Error('TabsState should be defined');
  }

  const innerState = useObjectRef(
    () => ({
      invalidTabs: new Set<string>(),
      scheduledTabSwitch: -1,
      invalidate(tabId: string) {
        this.invalidTabs.add(tabId);
        this.scheduleTabSwitch();
      },
      selectNextInvalidTab() {
        const next = Array.from(this.invalidTabs)[0] as string | undefined;

        if (!isDefined(next) || (isNotNullDefined(this.tabsContext.state.selectedId) && this.invalidTabs.has(this.tabsContext.state.selectedId))) {
          return;
        }

        this.tabsContext.open(next).catch(() => {
          this.notificationService.logError({ title: 'core_ui_form_save_error', message: 'core_ui_switch_tab_error' });
        });
      },
      reset() {
        this.invalidTabs.clear();
      },
      scheduleTabSwitch() {
        this.clearScheduledTabSwitch();

        this.scheduledTabSwitch = setTimeout(() => {
          this.scheduledTabSwitch = -1;

          this.selectNextInvalidTab();
          this.reset();
        }, 0) as any;
      },
      clearScheduledTabSwitch() {
        if (this.scheduledTabSwitch !== -1) {
          clearTimeout(this.scheduledTabSwitch);
          this.scheduledTabSwitch = -1;
        }
      },
    }),
    { tabsContext, notificationService },
    ['invalidate'],
  );

  return <TabsValidationContext.Provider value={innerState}>{children}</TabsValidationContext.Provider>;
});
