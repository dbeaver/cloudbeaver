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
  ColoredContainer,
  Combobox,
  Container,
  Group,
  GroupTitle,
  InputField,
  ObjectPropertyInfoForm,
  Select,
  useAutoLoad,
  useFormCustomInputValidation,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { FormMode, type TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { getObjectPropertyOptionName, getObjectPropertyOptionValue } from '@cloudbeaver/core-sdk';
import { AiEnginesResource } from '@cloudbeaver/plugin-ai';

import { AIEnginePropertiesResource, MODEL_PROPERTY_ID } from '../../AIEnginePropertiesResource.js';
import type { IAIProfileFormProps } from '../IAIProfileFormProps.js';
import { AI_PROFILE_NAME_MAX_LENGTH, AI_PROFILE_NAME_MIN_LENGTH } from './AIProfileSchema.js';
import { getAIProfileFormPart } from './getAIProfileFormPart.js';

export const AIProfileOptions: TabContainerPanelComponent<IAIProfileFormProps> = observer(function AIProfileOptions({ formState }) {
  const translate = useTranslate();
  const notificationService = useService(NotificationService);
  const enginesLoader = useResource(AIProfileOptions, AiEnginesResource, undefined);
  const part = getAIProfileFormPart(formState);
  const propertiesLoader = useResource(AIProfileOptions, AIEnginePropertiesResource, part.state.engineId || null);
  const propertiesInfo = propertiesLoader.data ?? [];
  const isEditMode = formState.mode === FormMode.Edit;
  const [isLoading, setIsLoading] = useState(false);

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

  const modelProperty = propertiesInfo.find(property => property.id === MODEL_PROPERTY_ID);
  const models = [...(modelProperty?.validValues ?? [])].sort((a, b) => getObjectPropertyOptionName(a).localeCompare(getObjectPropertyOptionName(b)));
  const hasModels = !!modelProperty;
  const currentEngineProperties = propertiesInfo.filter(property => property.id !== MODEL_PROPERTY_ID);

  async function handleModelBlur() {
    if (!part.isActiveModelChanged) {
      return;
    }

    try {
      setIsLoading(true);
      await part.loadEngineProperties();
    } catch (error: any) {
      notificationService.logException(error, 'ai_administration_settings_preview_fail');
      part.state.properties[MODEL_PROPERTY_ID] = '';
    } finally {
      setIsLoading(false);
    }
  }

  function handleModelChange(value: string | null) {
    part.state.properties[MODEL_PROPERTY_ID] = value;
  }

  return (
    <ColoredContainer wrap overflow parent gap>
      <Container medium gap>
        <Group gap>
          <Container vertical gap>
            <InputField ref={nameRef} name="name" state={part.state} disabled={formState.isDisabled} small required>
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
              onSelect={value => value && part.changeEngine(value)}
            >
              {translate('plugin_ai_administration_profile_form_field_engine')}
            </Select>
          </Container>
        </Group>
        {!!part.state.engineId && (
          <Group gap medium>
            <GroupTitle>{translate('ai_administration_language_model_settings')}</GroupTitle>
            <Container vertical gap>
              {hasModels && (
                <Combobox
                  value={part.state.properties[MODEL_PROPERTY_ID]}
                  items={models}
                  keySelector={getObjectPropertyOptionValue}
                  valueSelector={getObjectPropertyOptionName}
                  disabled={formState.isDisabled}
                  loading={isLoading}
                  allowCustomValue
                  required
                  small
                  onChange={handleModelChange}
                  onBlur={handleModelBlur}
                >
                  {translate('ai_administration_select_language_model_selector_title')}
                </Combobox>
              )}
              <ObjectPropertyInfoForm
                disabled={isLoading || formState.isDisabled}
                state={part.state.properties}
                properties={currentEngineProperties}
                showRememberTip
                small
              />
            </Container>
          </Group>
        )}
      </Container>
    </ColoredContainer>
  );
});
