/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { UserMetaParametersResource } from '@cloudbeaver/core-authentication';
import { Container, ObjectPropertyInfoForm, useResource } from '@cloudbeaver/core-blocks';

import type { IUserProfileFormInfoState } from './IUserProfileFormInfoState.js';

interface Props {
  state: IUserProfileFormInfoState;
  tabSelected: boolean;
  disabled: boolean;
}

export const UserProfileFormInfoMetaParameters = observer<Props>(function UserProfileFormInfoMetaParameters({ state, tabSelected, disabled }) {
  const userMetaParameters = useResource(UserProfileFormInfoMetaParameters, UserMetaParametersResource, undefined, { active: tabSelected });

  if (userMetaParameters.data.length === 0) {
    return null;
  }

  return (
    <Container wrap gap>
      <ObjectPropertyInfoForm state={state.metaParameters} properties={userMetaParameters.data} disabled={disabled} readOnly fill tiny />
    </Container>
  );
});
