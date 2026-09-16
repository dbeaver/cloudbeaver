/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import {
  Button,
  ColoredContainer,
  Container,
  Form,
  GroupBack,
  GroupTitle,
  StatusMessage,
  Text,
  useForm,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import { TabList, TabPanelList, TabsState } from '@cloudbeaver/core-ui';
import { getFirstException } from '@cloudbeaver/core-utils';

import { getAIProfileCredentialsFormPart } from '../AIProfileCredentialsForm/getAIProfileCredentialsFormPart.js';
import { AIProfileCredentialsPanelService } from '../AIProfileCredentialsPanelService.js';

const CREDENTIALS_TAB_ID = 'credentials';

export const AIProfileCredentialsPanel = observer(function AIProfileCredentialsPanel() {
  const translate = useTranslate();
  const credentialsPanelService = useService(AIProfileCredentialsPanelService);
  const notificationService = useService(NotificationService);
  const formState = credentialsPanelService.formState;
  const form = useForm({ onSubmit: save });

  if (!formState) {
    return null;
  }

  const part = getAIProfileCredentialsFormPart(formState);
  const title = `${translate('ui_edit')} "${part.state.profileName}"`;

  async function save(): Promise<void> {
    if (!formState) {
      return;
    }

    const saved = await formState.save();

    if (saved) {
      notificationService.logSuccess({
        title: 'plugin_ai_user_profile_credentials_saved',
        message: part.state.profileName,
      });
      await credentialsPanelService.back();
      return;
    }

    const exception = getFirstException(formState.exception);
    if (exception) {
      notificationService.logException(exception, 'plugin_ai_credentials_save_failed');
    }
  }

  return (
    <ColoredContainer aria-label={title} parent vertical noWrap surface gap compact>
      <GroupTitle header>
        <GroupBack onClick={() => credentialsPanelService.back()}>
          <Text truncate>{title}</Text>
        </GroupBack>
      </GroupTitle>
      <Form context={form} contents>
        <TabsState container={credentialsPanelService.parts} selectedId={CREDENTIALS_TAB_ID} formState={formState}>
          <Container noWrap vertical>
            <Container
              className="theme-border-color-background tw:relative tw:before:content-[''] tw:before:absolute tw:before:bottom-0 tw:before:w-full tw:before:border-b-2 tw:before:border-inherit"
              gap
              keepSize
              noWrap
            >
              <Container fill>
                <StatusMessage exception={getFirstException(formState.exception)} message={formState.statusMessage} type={ENotificationType.Info} />
                <TabList disabled={formState.isDisabled} underline big />
              </Container>
              <Container keepSize noWrap center gap compact>
                <Button type="button" disabled={formState.isDisabled} variant="secondary" onClick={() => credentialsPanelService.close()}>
                  {translate('ui_processing_cancel')}
                </Button>
                <Button type="button" disabled={formState.isDisabled || !formState.isChanged} loader onClick={() => form.submit()}>
                  {translate('ui_processing_save')}
                </Button>
              </Container>
            </Container>
            <Container vertical>
              <TabPanelList />
            </Container>
          </Container>
        </TabsState>
      </Form>
    </ColoredContainer>
  );
});
