/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { toJS } from 'mobx';

import type { UserInfoResource, UserResourceIncludes } from '@cloudbeaver/core-authentication';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import type { CachedResourceIncludeArgs } from '@cloudbeaver/core-resource';
import type { AdminUserInfoFragment } from '@cloudbeaver/core-sdk';
import { FormPart, IFormState } from '@cloudbeaver/core-ui';
import { isObjectsEqual, isValuesEqual } from '@cloudbeaver/core-utils';

import type { IUserProfileFormState } from '../UserProfileFormService';
import type { UserProfileFormState } from '../UserProfileFormState';
import { type IUserProfileFormInfoState, USER_PROFILE_FORM_INFO_PART_STATE_SCHEMA } from './IUserProfileFormInfoState';

export class UserProfileFormInfoPart extends FormPart<IUserProfileFormInfoState, IUserProfileFormState> {
  private baseIncludes: CachedResourceIncludeArgs<AdminUserInfoFragment, UserResourceIncludes>;
  constructor(formState: UserProfileFormState, private readonly userInfoResource: UserInfoResource) {
    super(formState, {
      userId: userInfoResource.data?.userId || '',
      displayName: userInfoResource.data?.displayName || '',
      authRole: userInfoResource.data?.authRole || '',
      metaParameters: toJS(userInfoResource.data?.metaParameters || {}),
    });
    this.baseIncludes = ['includeMetaParameters'];
  }

  protected format(data: IFormState<IUserProfileFormState>, contexts: IExecutionContextProvider<IFormState<IUserProfileFormState>>): void {
    this.state = USER_PROFILE_FORM_INFO_PART_STATE_SCHEMA.parse(this.state);
  }

  isOutdated(): boolean {
    return this.userInfoResource.isOutdated(undefined, this.baseIncludes);
  }

  isLoaded(): boolean {
    return this.loaded && this.userInfoResource.isLoaded(undefined, this.baseIncludes);
  }

  isChanged(): boolean {
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
    const user = await this.userInfoResource.load(undefined, this.baseIncludes);

    this.setInitialState({
      userId: user?.userId || '',
      displayName: user?.displayName || '',
      authRole: user?.authRole ?? '',
      metaParameters: toJS(user?.metaParameters || {}),
    });
  }
}
