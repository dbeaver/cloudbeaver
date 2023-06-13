/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { IconButton, Translate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { CreateTeamService } from './CreateTeamService';
import { TeamForm } from './TeamForm';

const styles = css`
  team-create {
    display: flex;
    flex-direction: column;
    height: 660px;
    overflow: hidden;
  }

  title-bar {
    composes: theme-border-color-background from global;
    box-sizing: border-box;
    padding: 8px;
    align-items: center;
    display: flex;
    font-weight: 400;
    flex: auto 0 0;
  }

  team-create-content {
    composes: theme-background-secondary theme-text-on-secondary from global;
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: auto;
  }

  fill {
    flex: 1;
  }
`;

export const CreateTeam: React.FC = observer(function CreateTeam() {
  const service = useService(CreateTeamService);

  if (!service.data) {
    return null;
  }

  return styled(styles)(
    <team-create>
      <title-bar>
        <Translate token="administration_teams_team_creation" />
        <fill />
        <IconButton name="cross" viewBox="0 0 16 16" onClick={service.cancelCreate} />
      </title-bar>
      <team-create-content>
        <TeamForm state={service.data} onCancel={service.cancelCreate} onSave={service.cancelCreate} />
      </team-create-content>
    </team-create>,
  );
});
