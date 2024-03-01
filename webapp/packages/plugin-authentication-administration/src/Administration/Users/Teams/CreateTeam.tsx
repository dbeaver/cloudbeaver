/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Fill, IconButton, s, Translate, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import style from './CreateTeam.m.css';
import { CreateTeamService } from './CreateTeamService';
import { TeamForm } from './TeamForm';

export const CreateTeam: React.FC = observer(function CreateTeam() {
  const translate = useTranslate();
  const styles = useS(style);
  const service = useService(CreateTeamService);

  if (!service.data) {
    return null;
  }

  return (
    <div aria-label={translate('administration_teams_team_creation')} className={s(styles, { box: true })}>
      <div className={s(styles, { titleBar: true })}>
        <Translate token="administration_teams_team_creation" />
        <Fill />
        <IconButton name="cross" viewBox="0 0 16 16" onClick={service.cancelCreate} />
      </div>
      <div className={s(styles, { content: true })}>
        <TeamForm state={service.data} onCancel={service.cancelCreate} onSave={service.cancelCreate} />
      </div>
    </div>
  );
});
