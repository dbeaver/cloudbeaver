/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { AdministrationItemContentProps } from '@cloudbeaver/core-administration';
import { ColoredContainer, Form, Group, ToolsAction, ToolsPanel, useForm, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ServerSettingsService } from '@cloudbeaver/core-root';
import { Settings } from '@cloudbeaver/plugin-settings-panel';

const clientScope = ['server'];

export const SettingsAdministration = observer<AdministrationItemContentProps>(function SettingsAdministration() {
  const translate = useTranslate();
  const serverSettingsService = useService(ServerSettingsService);
  const notificationService = useService(NotificationService);
  const changed = serverSettingsService.isEdited();

  async function handleSave() {
    if (!changed) {
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

  return (
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
          </ToolsPanel>
        </Group>
        <Settings source={serverSettingsService} accessor={clientScope} />
      </ColoredContainer>
    </Form>
  );
});
