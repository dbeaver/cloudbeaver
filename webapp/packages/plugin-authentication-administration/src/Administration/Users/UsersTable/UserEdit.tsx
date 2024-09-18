/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, Loader, s, TableItemExpandProps, useS } from '@cloudbeaver/core-blocks';
import { FormMode } from '@cloudbeaver/core-ui';

import { AdministrationUserForm } from '../UserForm/AdministrationUserForm';
import { useAdministrationUserFormState } from './useAdministrationUserFormState';
import style from './UserEdit.module.css';

export const UserEdit = observer<TableItemExpandProps<string>>(function UserEdit({ item, onClose }) {
  const styles = useS(style);
  const state = useAdministrationUserFormState(item, state => state.setMode(FormMode.Edit));

  return (
    <Container className={s(styles, { box: true })} parent vertical>
      <Loader suspense>
        <AdministrationUserForm state={state} onClose={onClose} />
      </Loader>
    </Container>
  );
});
