/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  ColoredContainer,
  Select,
  Container,
  Form,
  Group,
  GroupTitle,
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

import { AIProfilesResource } from './AIProfiles/AIProfilesResource.js';
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
  const profilesLoader = useResource(AIAdministrationPage, AIProfilesResource, CachedMapAllKey);
  const aiEnginesResource = useResource(AIAdministrationPage, AiEnginesResource, undefined);
  const profiles = profilesLoader.data.filter(isDefined);

  const settingsInfoPart = getAdministrationAISettingsFormInfoPart(formState);
  useAutoLoad(AIAdministrationPage, settingsInfoPart);

  const changed = settingsInfoPart.isChanged;
  const form = useForm({
    onSubmit: handleSave,
  });

  function handleLanguageChange(value: string | null) {
    settingsInfoPart.state.language = value ?? '';
  }

  function selectDefaultProfile(value: string | null) {
    if (value) {
      settingsInfoPart.state.defaultConfiguration = value;
    }
  }

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
            <Select
              items={profiles}
              valueSelector={value => value.name}
              keySelector={value => value.id}
              value={settingsInfoPart.state.defaultConfiguration}
              description={translate('plugin_ai_administration_default_profile_description')}
              disabled={!profiles.length}
              iconSelector={value => aiEnginesResource.data.find(e => e.id === value.engineId)?.icon}
              small
              onSelect={selectDefaultProfile}
            >
              {translate('plugin_ai_administration_default_profile_label')}
            </Select>

            <Combobox
              value={settingsInfoPart.state.language}
              items={LANGUAGE_OPTIONS}
              description={translate('plugin_ai_administration_language_description')}
              allowCustomValue
              allowClear
              small
              onChange={handleLanguageChange}
            >
              {translate('plugin_ai_administration_language_label')}
            </Combobox>
          </Container>
        </Group>
      </ColoredContainer>
    </Form>
  );
});
