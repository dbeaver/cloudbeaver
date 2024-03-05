/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { Loader, s, TableItemExpandProps, useS } from '@cloudbeaver/core-blocks';
import { App, useService } from '@cloudbeaver/core-di';
import { FormMode } from '@cloudbeaver/core-ui';

import { AdministrationUserForm } from '../UserForm/AdministrationUserForm';
import { AdministrationUserFormService } from '../UserForm/AdministrationUserFormService';
import { AdministrationUserFormState } from '../UserForm/AdministrationUserFormState';
import style from './UserEdit.m.css';

export const UserEdit = observer<TableItemExpandProps<string>>(function UserEdit({ item, onClose }) {
  const styles = useS(style);
  const administrationUserFormService = useService(AdministrationUserFormService);
  const app = useService(App);
  const [state] = useState(() => {
    const state = new AdministrationUserFormState(app, administrationUserFormService, {
      userId: item,
    });
    state.setMode(FormMode.Edit);
    return state;
  });

  return (
    <div className={s(styles, { box: true })}>
      <Loader suspense>
        <AdministrationUserForm state={state} onClose={onClose} />
      </Loader>
    </div>
  );
});
