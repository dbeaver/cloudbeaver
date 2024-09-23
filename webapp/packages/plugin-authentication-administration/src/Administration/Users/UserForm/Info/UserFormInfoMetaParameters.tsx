/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { UserMetaParametersResource } from '@cloudbeaver/core-authentication';
import { Group, GroupTitle, ObjectPropertyInfoForm, useResource, useTranslate } from '@cloudbeaver/core-blocks';

import type { UserFormProps } from '../AdministrationUserFormService.js';
import type { UserFormInfoPart } from './UserFormInfoPart.js';

interface Props extends UserFormProps {
  tabState: UserFormInfoPart;
  tabSelected: boolean;
  disabled: boolean;
}

export const UserFormInfoMetaParameters = observer<Props>(function UserFormInfoMetaParameters({ tabState, tabSelected, disabled }) {
  const translate = useTranslate();
  const userMetaParameters = useResource(UserFormInfoMetaParameters, UserMetaParametersResource, undefined, { active: tabSelected });

  if (userMetaParameters.data.length === 0) {
    return null;
  }

  return (
    <Group small gap vertical overflow>
      <GroupTitle keepSize>{translate('authentication_user_meta_parameters')}</GroupTitle>
      <ObjectPropertyInfoForm state={tabState.state.metaParameters} properties={userMetaParameters.data} disabled={disabled} keepSize tiny />
    </Group>
  );
});
