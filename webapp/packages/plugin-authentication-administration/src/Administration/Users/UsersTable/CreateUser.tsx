/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, Group, GroupTitle, Loader, s, Translate, useS } from '@cloudbeaver/core-blocks';
import type { IFormState } from '@cloudbeaver/core-ui';

import { AdministrationUserForm } from '../UserForm/AdministrationUserForm.js';
import type { IUserFormState } from '../UserForm/AdministrationUserFormService.js';
import style from './CreateUser.module.css';

interface Props {
  state: IFormState<IUserFormState>;
  onCancel: () => void;
}

export const CreateUser = observer<Props>(function CreateUser({ state, onCancel }) {
  const styles = useS(style);

  return (
    <Group aria-labelledby="create-user-title" className={s(styles, { box: true })} gap vertical noWrap>
      <GroupTitle id="create-user-title" header keepSize>
        <Translate token="authentication_administration_user_connections_user_add" />
      </GroupTitle>
      <Container overflow vertical>
        <Loader suspense>
          <AdministrationUserForm state={state} onClose={onCancel} />
        </Loader>
      </Container>
    </Group>
  );
});
