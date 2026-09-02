/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  Alert,
  ColoredContainer,
  Select,
  Container,
  Form,
  Group,
  GroupTitle,
  Text,
  ToolsAction,
  ToolsPanel,
  useAutoLoad,
  useForm,
  useResource,
  useTranslate,
  Combobox,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { NotificationService } from '@cloudbeaver/core-events';

import { AIAdminProfilesResource } from './AIProfiles/AIProfilesResource.js';
import { getAdministrationAISettingsFormInfoPart } from './AISettingsForm/getAdministrationAISettingsFormInfoPart.js';
import { LANGUAGE_OPTIONS } from './AISettingsForm/getLanguageOptions.js';
import type { AdministrationAISettingsFormState } from './AISettingsForm/AdministrationAISettingsFormState.js';
import { getFirstException } from '@cloudbeaver/core-utils';
import { isDefined } from '@dbeaver/js-helpers';
import { AiEnginesResource } from '@cloudbeaver/plugin-ai';

export const AIAdministrationPage = observer<{
  formState: AdministrationAISettingsFormState;
}>(function AIAdministrationPage({ formState }) {
  const translate = useTranslate();
  const notificationService = useService(NotificationService);
  const profilesLoader = useResource(AIAdministrationPage, AIAdminProfilesResource, CachedMapAllKey);
  const aiEnginesResource = useResource(AIAdministrationPage, AiEnginesResource, undefined);
  const profiles = profilesLoader.data.filter(isDefined);

  const settingsInfoPart = getAdministrationAISettingsFormInfoPart(formState);
  useAutoLoad(AIAdministrationPage, settingsInfoPart);

  const changed = settingsInfoPart.isChanged;
  const form = useForm({
    onSubmit: handleSave,
  });

  async function handleSave() {
    const saved = await formState.save();

    if (saved) {
      notificationService.logSuccess({ title: 'ai_administration_settings_save_success' });
    } else if (formState.isError) {
      notificationService.logException(getFirstException(formState.exception), 'ai_administration_settings_save_fail');
    }
  }

  function handleReset() {
    settingsInfoPart.reset();
  }

  return (
    <Form context={form} contents>
      <ColoredContainer vertical wrap parent gap>
        <Group box keepSize>
          <ToolsPanel rounded>
            <ToolsAction
              disabled={!changed}
              title={translate('ui_processing_save')}
              icon="admin-save"
              viewBox="0 0 24 24"
              onClick={() => form.submit()}
            >
              {translate('ui_processing_save')}
            </ToolsAction>
            <ToolsAction disabled={!changed} title={translate('ui_processing_cancel')} icon="admin-cancel" viewBox="0 0 24 24" onClick={handleReset}>
              {translate('ui_processing_cancel')}
            </ToolsAction>
          </ToolsPanel>
        </Group>
        <Group gap keepSize medium>
          <Container gap vertical>
            <GroupTitle>{translate('ai_administration_settings')}</GroupTitle>
            {!profiles.length && (
              <Alert title={translate('plugin_ai_administration_default_profile_no_profiles_title')}>
                <Text>{translate('plugin_ai_administration_default_profile_no_profiles_message')}</Text>
              </Alert>
            )}
            <Select
              items={profiles}
              valueSelector={value => value.name}
              keySelector={value => value.id}
              state={settingsInfoPart.state}
              name="defaultConfiguration"
              description={translate('plugin_ai_administration_default_profile_description')}
              disabled={!profiles.length}
              iconSelector={value => aiEnginesResource.data.find(e => e.id === value.engineId)?.icon}
              small
            >
              {translate('plugin_ai_administration_default_profile_label')}
            </Select>

            <Combobox
              name="language"
              state={settingsInfoPart.state}
              items={LANGUAGE_OPTIONS}
              description={translate('plugin_ai_administration_language_description')}
              allowCustomValue
              allowClear
              small
            >
              {translate('plugin_ai_administration_language_label')}
            </Combobox>
          </Container>
        </Group>
      </ColoredContainer>
    </Form>
  );
});
