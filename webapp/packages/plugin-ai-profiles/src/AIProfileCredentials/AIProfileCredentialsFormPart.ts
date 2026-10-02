/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { FormPart, type IFormState } from '@cloudbeaver/core-ui';

import { AIProfilesResource, type AIProfile } from '../AIProfilesResource.js';
import type { IAIProfileCredentialsFormState } from './IAIProfileCredentialsFormState.js';

export abstract class AIProfileCredentialsFormPart<T extends object> extends FormPart<T, IAIProfileCredentialsFormState> {
  constructor(
    formState: IFormState<IAIProfileCredentialsFormState>,
    initialState: T,
    protected readonly aiProfilesResource: AIProfilesResource,
  ) {
    super(formState, initialState);
  }

  get profile(): AIProfile | undefined {
    return this.aiProfilesResource.get(this.formState.state.profileId);
  }

  abstract get accountAuthentication(): boolean;

  override isOutdated(): boolean {
    return this.aiProfilesResource.isOutdated(this.formState.state.profileId);
  }

  override isLoaded(): boolean {
    return this.loaded && this.aiProfilesResource.isLoaded(this.formState.state.profileId);
  }
}
