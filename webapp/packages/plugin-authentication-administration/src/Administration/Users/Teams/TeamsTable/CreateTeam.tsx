/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, Group, GroupTitle, Loader, s, Translate, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { TeamForm } from '../TeamsForm/TeamForm.js';
import style from './CreateTeam.module.css';
import { CreateTeamService } from './CreateTeamService.js';

export const CreateTeam: React.FC = observer(function CreateTeam() {
  const translate = useTranslate();
  const styles = useS(style);
  const createTeamService = useService(CreateTeamService);

  if (!createTeamService.formState) {
    return null;
  }

  return (
    <Group aria-label={translate('administration_teams_team_creation')} className={s(styles, { box: true })} gap vertical noWrap>
      <GroupTitle header keepSize>
        <Translate token="administration_teams_team_creation" />
      </GroupTitle>
      <Container overflow vertical>
        <Loader suspense>
          <TeamForm state={createTeamService.formState} onCancel={createTeamService.cancelCreate} />
        </Loader>
      </Container>
    </Group>
  );
});
