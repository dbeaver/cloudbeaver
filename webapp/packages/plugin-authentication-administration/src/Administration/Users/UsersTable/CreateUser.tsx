/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, Group, GroupTitle, Loader, s, Translate, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { AdministrationUserForm } from '../UserForm/AdministrationUserForm.js';
import style from './CreateUser.module.css';
import { CreateUserService } from './CreateUserService.js';

export const CreateUser = observer(function CreateUser() {
  const styles = useS(style);
  const createUserService = useService(CreateUserService);

  if (!createUserService.formState) {
    return null;
  }

  return (
    <Group aria-labelledby="create-user-title" className={s(styles, { box: true })} gap vertical noWrap>
      <GroupTitle id="create-user-title" header keepSize>
        <Translate token="authentication_administration_user_connections_user_add" />
      </GroupTitle>
      <Container overflow vertical>
        <Loader suspense>
          <AdministrationUserForm state={createUserService.formState} onClose={createUserService.cancelCreate} />
        </Loader>
      </Container>
    </Group>
  );
});
