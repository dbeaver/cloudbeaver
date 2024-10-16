/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PasswordPolicyService, UserInfoMetaParametersResource, UserInfoResource } from '@cloudbeaver/core-authentication';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { FormPart, formValidationContext, type IFormState } from '@cloudbeaver/core-ui';
import { isValuesEqual, schemaValidationError } from '@cloudbeaver/core-utils';

import type { IUserProfileFormState } from '../UserProfileFormService.js';
import {
  type IUserProfileFormAuthenticationState,
  USER_PROFILE_FORM_AUTHENTICATION_PART_STATE_SCHEMA,
} from './IUserProfileFormAuthenticationState.js';

export class UserProfileFormAuthenticationPart extends FormPart<IUserProfileFormAuthenticationState, IUserProfileFormState> {
  constructor(
    formState: IFormState<IUserProfileFormState>,
    private readonly userInfoResource: UserInfoResource,
    private readonly passwordPolicyService: PasswordPolicyService,
    private readonly userInfoMetaParametersResource: UserInfoMetaParametersResource,
  ) {
    super(formState, {
      oldPassword: '',
      password: '',
      repeatedPassword: '',
    });
  }

  protected override format(data: IFormState<IUserProfileFormState>, contexts: IExecutionContextProvider<IFormState<IUserProfileFormState>>): void {
    const parsed = USER_PROFILE_FORM_AUTHENTICATION_PART_STATE_SCHEMA.safeParse(this.state);

    this.state = parsed.success ? parsed.data : this.initialState;
  }

  override isOutdated(): boolean {
    return this.userInfoResource.isOutdated(undefined) || this.userInfoMetaParametersResource.isOutdated(undefined);
  }

  override isLoaded(): boolean {
    return this.loaded && this.userInfoResource.isLoaded(undefined) && this.userInfoMetaParametersResource.isLoaded(undefined);
  }

  override get isChanged(): boolean {
    if (!this.loaded) {
      return false;
    }

    return (
      !isValuesEqual(this.state.oldPassword, this.initialState.oldPassword, null) ||
      !isValuesEqual(this.state.password, this.initialState.password, null) ||
      !isValuesEqual(this.state.repeatedPassword, this.initialState.repeatedPassword, null)
    );
  }

  protected override validate(
    data: IFormState<IUserProfileFormState>,
    contexts: IExecutionContextProvider<IFormState<IUserProfileFormState>>,
  ): void | Promise<void> {
    const state = USER_PROFILE_FORM_AUTHENTICATION_PART_STATE_SCHEMA.safeParse(this.state);
    const validation = contexts.getContext(formValidationContext);

    if (!state.success) {
      validation.error(schemaValidationError(state.error, { prefix: null }).toString());
      return;
    }

    const passwordValidation = this.passwordPolicyService.validatePassword(this.state.password);

    if (!passwordValidation.isValid) {
      validation.error(passwordValidation.errorMessage);
      return;
    }
  }

  protected async saveChanges(): Promise<void> {
    await this.userInfoResource.updateLocalPassword(this.state.oldPassword, this.state.password);
  }

  protected override async loader() {
    this.setInitialState({
      oldPassword: '',
      password: '',
      repeatedPassword: '',
    });
  }
}
