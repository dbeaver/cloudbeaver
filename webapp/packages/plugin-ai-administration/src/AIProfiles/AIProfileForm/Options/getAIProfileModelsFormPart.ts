/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import type { IFormState } from '@cloudbeaver/core-ui';

import { AIProfilesResource } from '../../AIProfilesResource.js';
import type { IAIProfileFormState } from '../IAIProfileFormState.js';
import type { AIProfileFormPart } from './AIProfileFormPart.js';
import { AIProfileModelsFormPart } from './AIProfileModelsFormPart.js';

const DATA_CONTEXT_AI_PROFILE_MODELS_FORM_PART = createDataContext<AIProfileModelsFormPart>('ai-profile-models-form-part');

export function getAIProfileModelsFormPart(formState: IFormState<IAIProfileFormState>, profileFormPart: AIProfileFormPart): AIProfileModelsFormPart {
  return formState.getPart(DATA_CONTEXT_AI_PROFILE_MODELS_FORM_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    const aiProfilesResource = di.getService(AIProfilesResource);

    return new AIProfileModelsFormPart(formState, aiProfilesResource, profileFormPart);
  });
}
