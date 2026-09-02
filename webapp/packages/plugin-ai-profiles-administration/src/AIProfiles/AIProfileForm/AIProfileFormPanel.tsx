/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Button, Form, GroupBack, GroupTitle, StatusMessage, useForm, useTranslate, Text } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import { FormMode, TabList, TabPanelList, TabsState } from '@cloudbeaver/core-ui';
import { getFirstException } from '@cloudbeaver/core-utils';

import type { IAIProfileFormProps } from './IAIProfileFormProps.js';
import { AIProfileFormService } from './AIProfileFormService.js';

export const AIProfileFormPanel = observer<IAIProfileFormProps>(function AIProfileFormPanel({ formState }) {
  const aiProfileFormService = useService(AIProfileFormService);
  const notificationService = useService(NotificationService);
  const translate = useTranslate();
  const creating = formState.mode === FormMode.Create;

  const form = useForm({
    onSubmit: async function onSubmit() {
      const saved = await formState.save();
      const exception = getFirstException(formState.exception);

      if (saved) {
        notificationService.logSuccess({
          title: creating ? 'plugin_ai_administration_profile_created' : 'plugin_ai_administration_profile_updated',
          message: formState.state.name,
        });
      } else if (exception) {
        notificationService.logException(
          exception,
          creating ? 'plugin_ai_administration_profile_create_error' : 'plugin_ai_administration_profile_save_error',
        );
      }
    },
  });

  const label = translate(creating ? 'plugin_ai_administration_profile_create' : 'plugin_ai_administration_profile_edit');

  return (
    <Form context={form} contents>
      <TabsState container={aiProfileFormService.parts} localState={formState.parts} formState={formState}>
        <div
          aria-label={label}
          className="tw:flex tw:flex-col tw:flex-1 tw:h-full tw:overflow-auto theme-background-secondary theme-text-on-secondary"
        >
          <div className="tw:relative tw:flex tw:items-end tw:border-b-2 theme-border-color-background theme-background-secondary theme-text-on-secondary">
            <div className="tw:flex-1 tw:overflow-hidden tw:pt-2 tw:pl-2">
              <GroupTitle header>
                <GroupBack onClick={() => aiProfileFormService.close()}>
                  <Text truncate>
                    {creating ? translate('plugin_ai_administration_profile_create') : `${translate('ui_edit')} "${formState.state.name}"`}
                  </Text>
                </GroupBack>
              </GroupTitle>
              <div className="tw:p-2">
                <StatusMessage exception={getFirstException(formState.exception)} message={formState.statusMessage} type={ENotificationType.Info} />
              </div>
              <TabList disabled={formState.isDisabled} underline big />
            </div>
            <div className="tw:flex tw:items-center tw:gap-4 tw:py-2 tw:pr-6">
              <Button type="button" disabled={formState.isDisabled} variant="secondary" onClick={() => aiProfileFormService.close()}>
                {translate('ui_processing_cancel')}
              </Button>
              <Button type="submit" disabled={formState.isDisabled || !formState.isChanged}>
                {translate(creating ? 'ui_processing_create' : 'ui_processing_save')}
              </Button>
            </div>
          </div>
          <div className="tw:relative tw:flex tw:flex-1 tw:flex-col tw:overflow-auto theme-background-secondary theme-border-color-background">
            <TabPanelList />
          </div>
        </div>
      </TabsState>
    </Form>
  );
});
