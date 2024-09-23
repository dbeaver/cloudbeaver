/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { toJS } from 'mobx';

import type { UserInfoMetaParametersResource, UserInfoResource } from '@cloudbeaver/core-authentication';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { FormPart, type IFormState } from '@cloudbeaver/core-ui';
import { isObjectsEqual, isValuesEqual } from '@cloudbeaver/core-utils';

import type { IUserProfileFormState } from '../UserProfileFormService.js';
import { type IUserProfileFormInfoState, USER_PROFILE_FORM_INFO_PART_STATE_SCHEMA } from './IUserProfileFormInfoState.js';

export class UserProfileFormInfoPart extends FormPart<IUserProfileFormInfoState, IUserProfileFormState> {
  constructor(
    formState: IFormState<IUserProfileFormState>,
    private readonly userInfoResource: UserInfoResource,
    private readonly userInfoMetaParametersResource: UserInfoMetaParametersResource,
  ) {
    super(formState, {
      userId: userInfoResource.data?.userId || '',
      displayName: userInfoResource.data?.displayName || '',
      authRole: userInfoResource.data?.authRole || '',
      metaParameters: toJS(userInfoMetaParametersResource.data || {}),
    });
  }

  protected override format(data: IFormState<IUserProfileFormState>, contexts: IExecutionContextProvider<IFormState<IUserProfileFormState>>): void {
    this.state = USER_PROFILE_FORM_INFO_PART_STATE_SCHEMA.parse(this.state);
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
      !isValuesEqual(this.state.userId, this.initialState.userId, null) ||
      !isValuesEqual(this.state.displayName, this.initialState.displayName, null) ||
      !isObjectsEqual(this.state.metaParameters, this.initialState.metaParameters) ||
      !isValuesEqual(this.state.authRole, this.initialState.authRole, '')
    );
  }

  protected saveChanges(): Promise<void> {
    return Promise.resolve();
  }

  protected override async loader() {
    const [user, metaParameters] = await Promise.all([this.userInfoResource.load(undefined), this.userInfoMetaParametersResource.load(undefined)]);

    this.setInitialState({
      userId: user?.userId || '',
      displayName: user?.displayName || '',
      authRole: user?.authRole ?? '',
      metaParameters: toJS(metaParameters || {}),
    });
  }
}
