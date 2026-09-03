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
  ConfirmationDialog,
  Container,
  Form,
  Group,
  GroupBack,
  GroupTitle,
  InputField,
  SAVED_VALUE_INDICATOR,
  StatusMessage,
  Text,
  useAutoLoad,
  useFocus,
  useForm,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import { type IFormState, TabList, type TabContainerPanelComponent, TabPanelList, TabsContainer, TabsState } from '@cloudbeaver/core-ui';
import { getFirstException } from '@cloudbeaver/core-utils';

import { getAIProfileCredentialsFormPart } from '../AIProfileCredentialsForm/getAIProfileCredentialsFormPart.js';
import type { IAIProfileCredentialsFormState } from '../AIProfileCredentialsForm/IAIProfileCredentialsFormState.js';
import { AIProfileCredentialsPanelService } from '../AIProfileCredentialsPanelService.js';

const CREDENTIALS_TAB_ID = 'credentials';
interface IAIProfileCredentialsFieldsProps {
  formState: IFormState<IAIProfileCredentialsFormState>;
}

const tabs = new TabsContainer<IAIProfileCredentialsFieldsProps>('AI Profile Credentials');

tabs.add({
  key: CREDENTIALS_TAB_ID,
  name: 'plugin_ai_credentials_dialog_title',
  panel: () => AIProfileCredentialsFields,
});

const AIProfileCredentialsFields: TabContainerPanelComponent<IAIProfileCredentialsFieldsProps> = observer(function AIProfileCredentialsFields({
  formState,
}) {
  const translate = useTranslate();
  const notificationService = useService(NotificationService);
  const commonDialogService = useService(CommonDialogService);
  const [tokenRef] = useFocus<HTMLInputElement>({ autofocus: true });
  const part = getAIProfileCredentialsFormPart(formState);
  const state = part.state;

  useAutoLoad(AIProfileCredentialsFields, part);

  async function resetCredentials(): Promise<void> {
    if (!state) {
      return;
    }

    const { status } = await commonDialogService.open(ConfirmationDialog, {
      title: translate('plugin_ai_credentials_reset_title'),
      message: 'plugin_ai_credentials_reset_confirmation',
      confirmActionText: 'plugin_ai_credentials_reset',
    });

    if (status !== DialogueStateResult.Resolved) {
      return;
    }

    try {
      await part.resetCredentials();
      notificationService.logSuccess({
        title: 'plugin_ai_user_profile_credentials_reset',
        message: state.profileName,
      });
    } catch (exception: any) {
      notificationService.logException(exception, 'plugin_ai_credentials_reset_failed');
    }
  }

  return (
    <Group medium keepSize gap>
      <Text>{translate('plugin_ai_credentials_dialog_description')}</Text>
      <Container vertical gap>
        <InputField value={state.profileName} disabled={formState.isDisabled} readOnly>
          {translate('plugin_ai_credentials_profile')}
        </InputField>
        <InputField value={state.engineName} disabled={formState.isDisabled} readOnly>
          {translate('plugin_ai_credentials_engine')}
        </InputField>
        <InputField
          ref={tokenRef}
          state={state}
          type="password"
          name="token"
          autoComplete="new-password"
          required={!state.credentialsSaved}
          disabled={formState.isDisabled}
          placeholder={state.credentialsSaved ? SAVED_VALUE_INDICATOR : undefined}
          description={state.credentialsSaved ? translate('ui_processing_saved') : undefined}
        >
          {translate('plugin_ai_credentials_token')}
        </InputField>
      </Container>
      {state.credentialsSaved && (
        <div>
          <Button type="button" variant="secondary" disabled={formState.isDisabled} onClick={resetCredentials}>
            {translate('plugin_ai_credentials_reset')}
          </Button>
        </div>
      )}
    </Group>
  );
});

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
        <TabsState container={tabs} selectedId={CREDENTIALS_TAB_ID} formState={formState}>
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
