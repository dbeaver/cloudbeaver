/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  AdministrationPageContent,
  AdministrationPageHeader,
  AdministrationPageLayout,
  AdministrationPageNavigation,
  AdministrationPageTitle,
  type AdministrationItemContentProps,
} from '@cloudbeaver/core-administration';
import { Button, Form, useForm, useTranslate, getComputed, TextPlaceholder } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { WEBSITE_LINKS } from '@cloudbeaver/core-links';
import { Settings } from '@cloudbeaver/plugin-settings-panel';
import { TabList, TabsState, type ITabData } from '@cloudbeaver/core-ui';
import { SettingsAdministrationService } from './SettingsAdministrationService.js';
import { useState } from 'react';
import { SettingsResolverService } from '@cloudbeaver/core-settings';

export const SettingsAdministration = observer<AdministrationItemContentProps>(function SettingsAdministration() {
  const settingsResolverService = useService(SettingsResolverService);
  const settingsAdministrationService = useService(SettingsAdministrationService);
  const notificationService = useService(NotificationService);
  const [tabId, setTabId] = useState<string | null>(null);
  const translate = useTranslate();
  const tabInfo = getComputed(() => (tabId ? settingsAdministrationService.tabsContainer.getTabInfo(tabId) : null));
  const settingsSource = tabInfo?.options?.source;
  const accessor = tabInfo?.options?.accessor;
  const changed = settingsSource?.isEdited() || false;

  async function handleSave() {
    if (!changed) {
      return;
    }
    try {
      await settingsSource?.save();
      notificationService.logSuccess({ title: translate('plugin_settings_administration_settings_save_success') });
    } catch (error: any) {
      notificationService.logException(error, 'plugin_settings_administration_settings_save_fail');
    }
  }

  const form = useForm({
    async onSubmit() {
      await handleSave();
    },
  });

  function handleReset() {
    settingsSource?.clear();
  }

  function handleRestoreDefaults() {
    settingsSource?.restoreDefaults?.();
  }

  function handleTabChange(tab: ITabData<void>) {
    setTabId(tab.tabId);
  }

  const hideSingleTab = settingsAdministrationService.tabsContainer.getDisplayed().length === 1;

  return (
    <AdministrationPageLayout>
      <TabsState container={settingsAdministrationService.tabsContainer} currentTabId={tabId} onChange={handleTabChange}>
        <Form context={form} contents>
          <AdministrationPageHeader
            actionsSlot={
              <>
                {settingsSource?.restoreDefaults && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={settingsSource.isOverrideDefaults?.() === false}
                    onClick={handleRestoreDefaults}
                  >
                    {translate('plugin_user_profile_settings_restore_defaults')}
                  </Button>
                )}
                <Button type="button" variant="secondary" disabled={!changed} onClick={handleReset}>
                  {translate('ui_processing_cancel')}
                </Button>
                <Button type="button" variant="primary" disabled={!changed} onClick={() => form.submit()}>
                  {translate('ui_processing_save')}
                </Button>
              </>
            }
          >
            <AdministrationPageTitle docLink={WEBSITE_LINKS.SETTINGS_DOCUMENTATION_PAGE}>
              {translate('plugin_settings_administration_drawer_item_title')}
            </AdministrationPageTitle>
          </AdministrationPageHeader>
          <AdministrationPageNavigation hidden={hideSingleTab}>
            <TabList aria-label={translate('plugin_settings_administration_drawer_item_title')} underline />
          </AdministrationPageNavigation>
          <AdministrationPageContent>
            {settingsSource ? (
              <Settings resolver={settingsResolverService} source={settingsSource} accessor={accessor} />
            ) : (
              <TextPlaceholder>{translate('plugin_settings_administration_no_settings')}</TextPlaceholder>
            )}
          </AdministrationPageContent>
        </Form>
      </TabsState>
    </AdministrationPageLayout>
  );
});
