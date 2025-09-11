/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ColoredContainer, Form, Group, ToolsAction, ToolsPanel, useForm, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { UserSettingsService } from '@cloudbeaver/core-settings-user';
import { Settings } from '@cloudbeaver/plugin-settings-panel';
import { SettingsProviderService } from '@cloudbeaver/core-settings';

const clientScope = ['client'];

export const UserProfileSettings = observer(function UserProfileSettings() {
  const translate = useTranslate();
  const settingsProviderService = useService(SettingsProviderService);
  const userSettingsService = useService(UserSettingsService);
  const notificationService = useService(NotificationService);

  const changed = userSettingsService.isEdited();

  async function handleSave() {
    if (!changed) {
      return;
    }
    try {
      await userSettingsService.save();
      notificationService.logSuccess({ title: 'plugin_user_profile_settings_save_success' });
    } catch (error: any) {
      notificationService.logException(error, 'plugin_user_profile_settings_save_fail');
    }
  }

  const form = useForm({
    async onSubmit() {
      await handleSave();
    },
  });

  function handleReset() {
    userSettingsService.resetChanges();
  }

  function handleRestoreDefaults() {
    userSettingsService.restoreDefaults();
  }

  return (
    <Form context={form} contents>
      <ColoredContainer parent overflow compact vertical noWrap gap>
        <Group overflow box keepSize>
          <ToolsPanel rounded minHeight>
            <ToolsAction icon="admin-save" viewBox="0 0 24 24" disabled={!changed} onClick={() => form.submit()}>
              {translate('ui_processing_save')}
            </ToolsAction>
            <ToolsAction icon="admin-cancel" viewBox="0 0 24 24" disabled={!changed} onClick={handleReset}>
              {translate('ui_processing_cancel')}
            </ToolsAction>
            <ToolsAction
              icon="/icons/settings_restore_defaults2_m.svg#root"
              viewBox="0 0 24 24"
              disabled={!userSettingsService.isOverrideDefaults()}
              svg
              onClick={handleRestoreDefaults}
            >
              {translate('plugin_user_profile_settings_restore_defaults')}
            </ToolsAction>
          </ToolsPanel>
        </Group>
        <Settings resolver={settingsProviderService.settingsResolver} source={userSettingsService} accessor={clientScope} />
      </ColoredContainer>
    </Form>
  );
});
