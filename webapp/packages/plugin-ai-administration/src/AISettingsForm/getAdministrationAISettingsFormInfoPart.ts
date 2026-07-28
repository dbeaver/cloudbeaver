/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import type { IFormState } from '@cloudbeaver/core-ui';

import { AIProfilesResource } from '../AIProfiles/AIProfilesResource.js';
import { AISettingsResource } from '../AISettingsResource.js';
import { AdministrationAISettingsInfoPart } from './AdministrationAISettingsInfoPart.js';

const DATA_CONTEXT_ADMINISTRATION_AI_SETTINGS_FORM_INFO_PART = createDataContext<AdministrationAISettingsInfoPart>(
  'Administration AI Settings Info Part',
);

export function getAdministrationAISettingsFormInfoPart(formState: IFormState<null>): AdministrationAISettingsInfoPart {
  return formState.getPart(DATA_CONTEXT_ADMINISTRATION_AI_SETTINGS_FORM_INFO_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    const aiSettingsResource = di.getService(AISettingsResource);
    const aiProfilesResource = di.getService(AIProfilesResource);

    return new AdministrationAISettingsInfoPart(formState, aiSettingsResource, aiProfilesResource);
  });
}
