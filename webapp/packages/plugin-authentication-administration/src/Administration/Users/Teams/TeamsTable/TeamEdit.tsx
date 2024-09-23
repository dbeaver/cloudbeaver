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
import { Container, s, TableContext, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { TeamForm } from '../TeamForm.js';
import { useTeamFormState } from '../useTeamFormState.js';
import style from './TeamEdit.module.css';

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
    <Container className={s(styles, { box: true })} parent vertical>
      <TeamForm state={data} onCancel={collapse} />
    </Container>
  );
});
