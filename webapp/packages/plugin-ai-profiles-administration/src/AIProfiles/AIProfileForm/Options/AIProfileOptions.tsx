/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import {
  ActionIconButton,
  ColoredContainer,
  Combobox,
  Container,
  Group,
  GroupTitle,
  InputField,
  Radio,
  RadioGroup,
  Select,
  useAutoLoad,
  useExecutor,
  useFormCustomInputValidation,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { AiModelInfo } from '@cloudbeaver/core-sdk';
import { FormMode, type TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { AiEnginesResource } from '@cloudbeaver/plugin-ai';
import { AIProfileCredentialsService } from '@cloudbeaver/plugin-ai-profiles';

import {
  AIEnginePropertiesResource,
  CONTEXT_WINDOW_SIZE_PROPERTY_ID,
  MODEL_PROPERTY_ID,
  TEMPERATURE_PROPERTY_ID,
} from '../../AIEnginePropertiesResource.js';
import { AIProfilesAdministrationService } from '../../AIProfilesAdministrationService.js';
import type { IAIProfileFormProps } from '../IAIProfileFormProps.js';
import { AIProfilePropertiesForm } from './AIProfilePropertiesForm.js';
import { AI_PROFILE_NAME_MAX_LENGTH, AI_PROFILE_NAME_MIN_LENGTH } from './AIProfileSchema.js';
import { getAIProfileFormPart } from './getAIProfileFormPart.js';

export const AIProfileOptions: TabContainerPanelComponent<IAIProfileFormProps> = observer(function AIProfileOptions({ formState }) {
  const translate = useTranslate();
  const notificationService = useService(NotificationService);
  const aiProfileCredentialsService = useService(AIProfileCredentialsService);
  const aiProfilesAdministrationService = useService(AIProfilesAdministrationService);
  const enginesLoader = useResource(AIProfileOptions, AiEnginesResource, undefined);
  const part = getAIProfileFormPart(formState);
  const propertiesLoader = useResource(AIProfileOptions, AIEnginePropertiesResource, part.state.engineId || null);
  const propertiesInfo = propertiesLoader.data ?? [];
  const usesUserCredentials = !part.state.global;
  const configurableProperties = propertiesInfo
    .filter(property => property.id !== 'global' && (!usesUserCredentials || property.id !== 'token'))
    .map(property => (part.state.global && property.id === 'token' ? { ...property, required: true } : property));
  const isEditMode = formState.mode === FormMode.Edit;
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<AiModelInfo[] | null>(null);

  useAutoLoad(AIProfileOptions, part);

  const { ref: nameRef } = useFormCustomInputValidation<string, HTMLInputElement>(value => {
    if (value.trim().length > AI_PROFILE_NAME_MAX_LENGTH) {
      return translate('plugin_ai_administration_profile_name_max_length', undefined, { length: AI_PROFILE_NAME_MAX_LENGTH });
    }

    if (value.trim().length < AI_PROFILE_NAME_MIN_LENGTH) {
      return translate('plugin_ai_administration_profile_name_min_length', undefined, { length: AI_PROFILE_NAME_MIN_LENGTH });
    }

    return null;
  });

  const modelPropertyIndex = configurableProperties.findIndex(property => property.id === MODEL_PROPERTY_ID);
  const modelProperty = configurableProperties[modelPropertyIndex];
  const chatModels = (models ?? []).filter(model => model.features.map(feature => feature.toLowerCase()).includes('chat'));
  const hasModels = !!modelProperty;
  const userCredentialsSupported = aiProfileCredentialsService.isSupported(propertiesInfo);
  const propertiesBeforeModel = hasModels ? configurableProperties.slice(0, modelPropertyIndex) : configurableProperties;
  const propertiesAfterModel = hasModels ? configurableProperties.slice(modelPropertyIndex + 1) : [];

  function applyModelToProfile(modelId: string | null, availableModels = models ?? []): void {
    const model = availableModels.find(model => model.id === modelId);
    part.state.properties[MODEL_PROPERTY_ID] = modelId;

    if (!model) {
      return;
    }

    part.state.properties[CONTEXT_WINDOW_SIZE_PROPERTY_ID] = model.contextWindowSize;
    part.state.properties[TEMPERATURE_PROPERTY_ID] = model.defaultTemperature;
  }

  async function loadModels(notifyOnError: boolean): Promise<AiModelInfo[] | null> {
    const engineId = part.state.engineId;
    if (!engineId) {
      return null;
    }

    try {
      setIsLoading(true);
      const profileId = formState.mode === FormMode.Edit ? formState.state.profileId : undefined;
    const loadedModels = (await aiProfilesAdministrationService.loadModels(engineId, profileId, part.getCurrentEngineSettings())).toSorted((a, b) =>
        a.id.localeCompare(b.id),
      );
      setModels(loadedModels);
      return loadedModels;
    } catch (error: any) {
      if (notifyOnError) {
        notificationService.logException(error, 'ai_administration_models_refresh_fail');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshModels(): Promise<void> {
    const loadedModels = await loadModels(true);

    if (loadedModels === null) {
      return;
    }

    const currentModelId = part.state.properties[MODEL_PROPERTY_ID];
    const firstChatModel = loadedModels.find(model => model.features.some(feature => feature.toLowerCase() === 'chat'));

    if (firstChatModel && !currentModelId) {
      applyModelToProfile(firstChatModel.id, loadedModels);
    }
  }

  useExecutor({
    executor: formState.loadedTask,
    handlers: [
      async () => {
        if (isEditMode && part.state.engineId && models === null && !usesUserCredentials) {
          await loadModels(false);
        }
      },
    ],
  });

  function handleModelChange(value: string | null) {
    applyModelToProfile(value);
  }

  async function handleEngineChange(engineId: string): Promise<void> {
    await part.changeEngine(engineId);
    setModels(null);
  }

  function handleProfileTypeChange(value: string): void {
    const global = value === 'global';
    part.state.global = global;
    part.state.properties['global'] = global;
    if (!global) {
      part.state.properties['token'] = null;
    }
  }

  return (
    <ColoredContainer wrap overflow parent gap>
      <Container medium gap>
        <Group gap>
          <Container vertical gap>
            <InputField ref={nameRef} name="name" state={part.state} disabled={formState.isDisabled} autoComplete="off" small required>
              {translate('plugin_ai_administration_profile_form_field_name')}
            </InputField>
            <Select
              items={enginesLoader.data}
              valueSelector={value => value.name}
              keySelector={value => value.id}
              value={part.state.engineId}
              disabled={formState.isDisabled || isEditMode}
              iconSelector={value => value.icon}
              small
              required
              onSelect={value => value && handleEngineChange(value)}
            >
              {translate('plugin_ai_administration_profile_form_field_engine')}
            </Select>
            <RadioGroup
              name="profileType"
              aria-label={translate('plugin_ai_administration_profile_profile_type')}
              value={part.state.global ? 'global' : 'user'}
              onChange={handleProfileTypeChange}
            >
              <Radio value="global" disabled={formState.isDisabled || isEditMode} small keepSize>
                {translate('plugin_ai_administration_profile_global_credentials')}
              </Radio>
              <Radio
                value="user"
                disabled={formState.isDisabled || isEditMode || !userCredentialsSupported}
                title={!userCredentialsSupported ? translate('plugin_ai_administration_profile_user_credentials_unsupported') : undefined}
                small
                keepSize
              >
                {translate('plugin_ai_administration_profile_user_credentials')}
              </Radio>
            </RadioGroup>
          </Container>
        </Group>
        {!!part.state.engineId && (
          <Group gap medium>
            <GroupTitle>{translate('ai_administration_language_model_settings')}</GroupTitle>
            <Container vertical gap>
              <AIProfilePropertiesForm
                disabled={isLoading || formState.isDisabled}
                state={part.state.properties}
                properties={propertiesBeforeModel}
              />
              {hasModels && (
                <Container className="tw:w-full" small>
                  <Combobox
                    className="tw:w-full"
                    value={part.state.properties[MODEL_PROPERTY_ID]}
                    items={chatModels}
                    keySelector={model => model.id}
                    valueSelector={model => model.id}
                    disabled={formState.isDisabled}
                    loading={isLoading}
                    description={translate('ai_administration_models_refresh_description')}
                    allowCustomValue
                    required
                    small
                    onChange={handleModelChange}
                  >
                    {translate('ai_administration_select_language_model_selector_title')}
                  </Combobox>
                  {!usesUserCredentials && (
                    <div className="tw:absolute tw:top-9 tw:-right-9">
                      <ActionIconButton
                        name="refresh"
                        title={translate('ai_administration_models_refresh')}
                        disabled={isLoading || formState.isDisabled}
                        onClick={refreshModels}
                      />
                    </div>
                  )}
                </Container>
              )}
              <AIProfilePropertiesForm
                disabled={isLoading || formState.isDisabled}
                state={part.state.properties}
                properties={propertiesAfterModel}
              />
            </Container>
          </Group>
        )}
      </Container>
    </ColoredContainer>
  );
});
