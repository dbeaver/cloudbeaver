/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useContext } from 'react';

import { AuthConfigurationsResource } from '@cloudbeaver/core-authentication';
import { s, TableContext, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { AuthConfigurationForm } from '../AuthConfigurationForm';
import { useAuthConfigurationFormState } from '../useAuthConfigurationFormState';
import style from './AuthConfigurationEdit.m.css';

interface Props {
  item: string;
}

export const AuthConfigurationEdit = observer<Props>(function AuthConfigurationEdit({ item }) {
  const styles = useS(style);
  const resource = useService(AuthConfigurationsResource);
  const tableContext = useContext(TableContext);

  const collapse = useCallback(() => {
    tableContext?.setItemExpand(item, false);
  }, [tableContext, item]);

  const data = useAuthConfigurationFormState(resource, state => state.setOptions('edit'));

  data.config.id = item;

  return (
    <div className={s(styles, { box: true })}>
      <AuthConfigurationForm state={data} onCancel={collapse} />
    </div>
  );
});
