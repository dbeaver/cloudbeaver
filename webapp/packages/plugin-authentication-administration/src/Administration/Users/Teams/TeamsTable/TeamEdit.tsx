/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useContext } from 'react';

import { TeamsResource } from '@cloudbeaver/core-authentication';
import { s, TableContext, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { TeamForm } from '../TeamForm';
import { useTeamFormState } from '../useTeamFormState';
import style from './TeamEdit.m.css';

interface Props {
  item: string;
}

export const TeamEdit = observer<Props>(function TeamEdit({ item }) {
  const styles = useS(style);
  const resource = useService(TeamsResource);
  const tableContext = useContext(TableContext);

  const collapse = useCallback(() => {
    tableContext?.setItemExpand(item, false);
  }, [tableContext, item]);

  const data = useTeamFormState(resource, state => state.setOptions('edit'));

  data.config.teamId = item;

  return (
    <div className={s(styles, { box: true })}>
      <TeamForm state={data} onCancel={collapse} />
    </div>
  );
});
