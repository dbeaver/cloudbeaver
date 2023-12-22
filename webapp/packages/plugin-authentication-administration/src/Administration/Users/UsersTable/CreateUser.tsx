/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Loader, s, Translate, useS, useTranslate } from '@cloudbeaver/core-blocks';
import type { IFormState } from '@cloudbeaver/core-ui';

import { AdministrationUserForm } from '../UserForm/AdministrationUserForm';
import type { IUserFormState } from '../UserForm/AdministrationUserFormService';
import style from './CreateUser.m.css';

interface Props {
  state: IFormState<IUserFormState>;
  onCancel: () => void;
}

export const CreateUser = observer<Props>(function CreateUser({ state, onCancel }) {
  const translate = useTranslate();
  const styles = useS(style);

  return (
    <div aria-label={translate('authentication_administration_user_connections_user_add')} className={s(styles, { box: true })}>
      <div className={s(styles, { titleBar: true })}>
        <Translate token="authentication_administration_user_connections_user_add" />
      </div>
      <div className={s(styles, { content: true })}>
        <Loader suspense>
          <AdministrationUserForm state={state} onClose={onCancel} />
        </Loader>
      </div>
    </div>
  );
});
