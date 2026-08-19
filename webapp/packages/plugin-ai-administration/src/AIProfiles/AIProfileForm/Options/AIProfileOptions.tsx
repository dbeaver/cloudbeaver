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
  Select,
  useAutoLoad,
  useFormCustomInputValidation,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { FormMode, type TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { AiEnginesResource } from '@cloudbeaver/plugin-ai';

import { AIEnginePropertiesResource, MODEL_PROPERTY_ID } from '../../AIEnginePropertiesResource.js';
import type { IAIProfileFormProps } from '../IAIProfileFormProps.js';
import { AIProfilePropertiesForm } from './AIProfilePropertiesForm.js';
import { AI_PROFILE_NAME_MAX_LENGTH, AI_PROFILE_NAME_MIN_LENGTH } from './AIProfileSchema.js';
import { getAIProfileFormPart } from './getAIProfileFormPart.js';
import { getAIProfileModelsFormPart } from './getAIProfileModelsFormPart.js';

export const AIProfileOptions: TabContainerPanelComponent<IAIProfileFormProps> = observer(function AIProfileOptions({ formState }) {
  const translate = useTranslate();
  const notificationService = useService(NotificationService);
  const enginesLoader = useResource(AIProfileOptions, AiEnginesResource, undefined);
  const part = getAIProfileFormPart(formState);
  const modelsPart = getAIProfileModelsFormPart(formState, part);
  const propertiesLoader = useResource(AIProfileOptions, AIEnginePropertiesResource, part.state.engineId || null);
  const propertiesInfo = propertiesLoader.data ?? [];
  const isEditMode = formState.mode === FormMode.Edit;
  const [isLoading, setIsLoading] = useState(false);

  useAutoLoad(AIProfileOptions, [part, modelsPart]);

  const { ref: nameRef } = useFormCustomInputValidation<string, HTMLInputElement>(value => {
    if (value.trim().length > AI_PROFILE_NAME_MAX_LENGTH) {
      return translate('plugin_ai_administration_profile_name_max_length', undefined, { length: AI_PROFILE_NAME_MAX_LENGTH });
    }

    if (value.trim().length < AI_PROFILE_NAME_MIN_LENGTH) {
      return translate('plugin_ai_administration_profile_name_min_length', undefined, { length: AI_PROFILE_NAME_MIN_LENGTH });
    }

    return null;
  });

  const modelPropertyIndex = propertiesInfo.findIndex(property => property.id === MODEL_PROPERTY_ID);
  const modelProperty = propertiesInfo[modelPropertyIndex];
  const chatModels = modelsPart.state.models.filter(model => model.features.map((feature: string) => feature.toLowerCase()).includes('chat'));
  const hasModels = !!modelProperty;
  const propertiesBeforeModel = hasModels ? propertiesInfo.slice(0, modelPropertyIndex) : propertiesInfo;
  const propertiesAfterModel = hasModels ? propertiesInfo.slice(modelPropertyIndex + 1) : [];

  async function refreshModels(): Promise<void> {
    try {
      setIsLoading(true);
      await modelsPart.loadModels();
    } catch (error: any) {
      notificationService.logException(error, 'ai_administration_models_refresh_fail');
    } finally {
      setIsLoading(false);
    }
  }

  function handleModelChange(value: string | null) {
    modelsPart.applyModelToProfile(value);
  }

  async function handleEngineChange(engineId: string): Promise<void> {
    await part.changeEngine(engineId);
    await modelsPart.loadModels();
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
                <div className="tw:flex tw:items-start tw:gap-2">
                  <Combobox
                    value={part.state.properties[MODEL_PROPERTY_ID]}
                    items={chatModels}
                    keySelector={model => model.id}
                    valueSelector={model => model.id}
                    disabled={formState.isDisabled}
                    loading={isLoading}
                    description={translate('ai_administration_models_refresh_description')}
                    action={
                      <ActionIconButton
                        name="refresh"
                        title={translate('ai_administration_models_refresh')}
                        disabled={isLoading || formState.isDisabled}
                        onClick={refreshModels}
                      />
                    }
                    allowCustomValue
                    required
                    small
                    onChange={handleModelChange}
                  >
                    {translate('ai_administration_select_language_model_selector_title')}
                  </Combobox>
                </div>
              )}
              <AIProfilePropertiesForm disabled={isLoading || formState.isDisabled} state={part.state.properties} properties={propertiesAfterModel} />
            </Container>
          </Group>
        )}
      </Container>
    </ColoredContainer>
  );
});
