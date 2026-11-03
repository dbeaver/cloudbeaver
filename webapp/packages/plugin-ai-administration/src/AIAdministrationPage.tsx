/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { AdministrationPageContent, AdministrationPageHeader, AdministrationPageTitle } from '@cloudbeaver/core-administration';
import {
  Alert,
  Button,
  Select,
  Form,
  StatusMessage,
  Text,
  useAutoLoad,
  useForm,
  useResource,
  useTranslate,
  Combobox,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { WEBSITE_LINKS } from '@cloudbeaver/core-links';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import { AIProfilesResource, compareAIProfiles } from '@cloudbeaver/plugin-ai-profiles';

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
  const profiles = profilesLoader.data.filter(isDefined).sort(compareAIProfiles);

  const settingsInfoPart = getAdministrationAISettingsFormInfoPart(formState);
  const exception = getFirstException(formState.exception);

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
      <AdministrationPageHeader
        actionsSlot={
          <>
            <Button type="button" variant="secondary" disabled={!changed} onClick={handleReset}>
              {translate('ui_processing_cancel')}
            </Button>
            <Button type="button" variant="primary" disabled={!changed} onClick={() => form.submit()}>
              {translate('ui_processing_save')}
            </Button>
          </>
        }
      >
        <AdministrationPageTitle docLink={WEBSITE_LINKS.AI_SETTINGS_DOCUMENTATION_PAGE}>
          {translate('ai_administration_settings')}
        </AdministrationPageTitle>
      </AdministrationPageHeader>
      <AdministrationPageContent>
        <div className="tw:flex tw:max-w-sm tw:flex-col tw:gap-6">
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
          >
            {translate('plugin_ai_administration_language_label')}
          </Combobox>
          {exception && (
            <div>
              <StatusMessage exception={exception} type={ENotificationType.Error} />
            </div>
          )}
        </div>
      </AdministrationPageContent>
    </Form>
  );
});
