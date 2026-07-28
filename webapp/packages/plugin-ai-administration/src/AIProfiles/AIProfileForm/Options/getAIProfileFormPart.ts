/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import type { IFormState } from '@cloudbeaver/core-ui';

import { AIEnginePropertiesResource } from '../../AIEnginePropertiesResource.js';
import { AIProfilesResource } from '../../AIProfilesResource.js';
import type { IAIProfileFormState } from '../IAIProfileFormState.js';
import { AIProfileFormPart } from './AIProfileFormPart.js';

const DATA_CONTEXT_AI_PROFILE_FORM_PART = createDataContext<AIProfileFormPart>('ai-profile-form-part');

export function getAIProfileFormPart(formState: IFormState<IAIProfileFormState>): AIProfileFormPart {
  return formState.getPart(DATA_CONTEXT_AI_PROFILE_FORM_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    const aiProfilesResource = di.getService(AIProfilesResource);
    const aiEnginePropertiesResource = di.getService(AIEnginePropertiesResource);

    return new AIProfileFormPart(formState, aiProfilesResource, aiEnginePropertiesResource);
  });
}
