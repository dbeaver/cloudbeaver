/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, Group, GroupTitle, s, Translate, useS, useTranslate } from '@cloudbeaver/core-blocks';
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
    <Group aria-label={translate('administration_teams_team_creation')} className={s(styles, { box: true })} box boxNoOverflow vertical noWrap>
      <GroupTitle header keepSize>
        <Translate token="administration_teams_team_creation" />
      </GroupTitle>
      <Container overflow>
        <TeamForm state={service.data} onCancel={service.cancelCreate} onSave={service.cancelCreate} />
      </Container>
    </Group>
  );
});
