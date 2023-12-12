/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { FormContext, useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { isDefined, isNotNullDefined } from '@cloudbeaver/core-utils';

import { TabsContext } from './TabsContext';
import { TabsValidationContext } from './TabsValidationContext';

export enum VALIDATION_SCHEDULE_TAB_SWITCH_STATUS {
  NOT_ACTIVE = 1,
}

export const TabsValidation = observer(function TabsValidation({ children }: React.PropsWithChildren) {
  const tabsContext = useContext(TabsContext);
  const formContext = useContext(FormContext);
  const notificationService = useService(NotificationService);

  if (!tabsContext) {
    throw new Error('TabsState should be defined');
  }

  const innerState = useObjectRef(
    () => ({
      invalidTabs: new Set<string>(),
      scheduledTabSwitch: VALIDATION_SCHEDULE_TAB_SWITCH_STATUS.NOT_ACTIVE,
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
          this.scheduledTabSwitch = VALIDATION_SCHEDULE_TAB_SWITCH_STATUS.NOT_ACTIVE;

          this.selectNextInvalidTab();
          this.reset();
        }, 0) as any;
      },
      clearScheduledTabSwitch() {
        if (this.scheduledTabSwitch !== VALIDATION_SCHEDULE_TAB_SWITCH_STATUS.NOT_ACTIVE) {
          clearTimeout(this.scheduledTabSwitch);
          this.scheduledTabSwitch = VALIDATION_SCHEDULE_TAB_SWITCH_STATUS.NOT_ACTIVE;
        }
      },
    }),
    { tabsContext, formContext, notificationService },
    ['invalidate', 'reset'],
  );

  return <TabsValidationContext.Provider value={innerState}>{children}</TabsValidationContext.Provider>;
});
