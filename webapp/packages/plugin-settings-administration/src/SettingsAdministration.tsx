/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { AdministrationItemContentProps } from '@cloudbeaver/core-administration';
import { ColoredContainer, Form, Group, ToolsAction, ToolsPanel, useForm, useTranslate, getComputed, TextPlaceholder } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { Settings } from '@cloudbeaver/plugin-settings-panel';
import { TabList, TabsState, type ITabData } from '@cloudbeaver/core-ui';
import { SettingsAdministrationService } from './SettingsAdministrationService.js';
import { useState } from 'react';

export const SettingsAdministration = observer<AdministrationItemContentProps>(function SettingsAdministration() {
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
    <TabsState container={settingsAdministrationService.tabsContainer} currentTabId={tabId} onChange={handleTabChange}>
      <Form context={form} contents>
        <ColoredContainer overflow parent vertical noWrap gap>
          <Group box keepSize>
            <ToolsPanel rounded>
              <ToolsAction icon="admin-save" viewBox="0 0 24 24" disabled={!changed} onClick={() => form.submit()}>
                {translate('ui_processing_save')}
              </ToolsAction>
              <ToolsAction icon="admin-cancel" viewBox="0 0 24 24" disabled={!changed} onClick={handleReset}>
                {translate('ui_processing_cancel')}
              </ToolsAction>
              {settingsSource?.restoreDefaults && (
                <ToolsAction
                  icon="/icons/settings_restore_defaults2_m.svg#root"
                  viewBox="0 0 24 24"
                  disabled={settingsSource.isOverrideDefaults?.() === false}
                  svg
                  onClick={handleRestoreDefaults}
                >
                  {translate('plugin_user_profile_settings_restore_defaults')}
                </ToolsAction>
              )}
            </ToolsPanel>
          </Group>
          <Group hidden={hideSingleTab} box keepSize hideOverflow>
            <TabList underline />
          </Group>
          {settingsSource ? <Settings source={settingsSource} accessor={accessor} /> : <TextPlaceholder>{translate('plugin_settings_administration_no_settings')}</TextPlaceholder>}
        </ColoredContainer>
      </Form>
    </TabsState>
  );
});
