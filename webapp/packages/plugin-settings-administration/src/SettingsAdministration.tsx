/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { AdministrationItemContentProps } from '@cloudbeaver/core-administration';
import { ColoredContainer, Container, Form, Group, ToolsAction, ToolsPanel, useForm, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ServerSettingsService } from '@cloudbeaver/core-root';
import { Settings } from '@cloudbeaver/plugin-settings-panel';

export const SettingsAdministration = observer<AdministrationItemContentProps>(function SettingsAdministration() {
  const translate = useTranslate();
  const serverSettingsService = useService(ServerSettingsService);
  const notificationService = useService(NotificationService);

  async function handleSave() {
    if (!serverSettingsService.isChanged) {
      return;
    }
    try {
      await serverSettingsService.save();
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
    serverSettingsService.resetChanges();
  }

  const changed = serverSettingsService.isChanged;

  return (
    <Form context={form} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ColoredContainer parent vertical wrap gap>
        <Group box keepSize>
          <ToolsPanel>
            <ToolsAction icon="admin-save" viewBox="0 0 24 24" disabled={!changed} onClick={() => form.submit()}>
              {translate('ui_processing_save')}
            </ToolsAction>
            <ToolsAction icon="admin-cancel" viewBox="0 0 24 24" disabled={!changed} onClick={handleReset}>
              {translate('ui_processing_cancel')}
            </ToolsAction>
          </ToolsPanel>
        </Group>
        <Settings source={serverSettingsService} />
      </ColoredContainer>
    </Form>
  );
});
