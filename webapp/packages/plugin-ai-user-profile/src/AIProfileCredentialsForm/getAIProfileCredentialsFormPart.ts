/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import type { IFormState } from '@cloudbeaver/core-ui';
import { AiEnginesResource } from '@cloudbeaver/plugin-ai';
import { AIProfilesResource } from '@cloudbeaver/plugin-ai-profiles';

import { AIProfileCredentialsFormPart } from './AIProfileCredentialsFormPart.js';
import type { IAIProfileCredentialsFormState } from './IAIProfileCredentialsFormState.js';

const DATA_CONTEXT_AI_PROFILE_CREDENTIALS_FORM_PART = createDataContext<AIProfileCredentialsFormPart>('ai-profile-credentials-form-part');

export function getAIProfileCredentialsFormPart(formState: IFormState<IAIProfileCredentialsFormState>): AIProfileCredentialsFormPart {
  return formState.getPart(DATA_CONTEXT_AI_PROFILE_CREDENTIALS_FORM_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    return new AIProfileCredentialsFormPart(formState, di.getService(AIProfilesResource), di.getService(AiEnginesResource));
  });
}
