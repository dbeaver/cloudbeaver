/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import type { IFormState } from '@cloudbeaver/core-ui';

import { AIProfilesResource } from '../AIProfilesResource.js';
import { AIProfileCredentialsService } from './AIProfileCredentialsService.js';
import { AIProfileTokenFormPart } from './AIProfileTokenFormPart.js';
import { AIProfileSubscriptionFormPart } from './AIProfileSubscriptionFormPart.js';
import type { IAIProfileCredentialsFormState } from './IAIProfileCredentialsFormState.js';

const TOKEN_PART = createDataContext<AIProfileTokenFormPart>('ai-profile-token-form-part');
const SUBSCRIPTION_PART = createDataContext<AIProfileSubscriptionFormPart>('ai-profile-subscription-form-part');

export function getAIProfileCredentialsFormParts(formState: IFormState<IAIProfileCredentialsFormState>): {
  token: AIProfileTokenFormPart;
  subscription: AIProfileSubscriptionFormPart;
} {
  const token = formState.getPart(TOKEN_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    return new AIProfileTokenFormPart(formState, di.getService(AIProfilesResource));
  });
  const subscription = getAIProfileSubscriptionFormPart(formState);
  return { token, subscription };
}

export function getAIProfileSubscriptionFormPart(formState: IFormState<IAIProfileCredentialsFormState>): AIProfileSubscriptionFormPart {
  return formState.getPart(SUBSCRIPTION_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    return new AIProfileSubscriptionFormPart(formState, di.getService(AIProfilesResource), di.getService(AIProfileCredentialsService));
  });
}
