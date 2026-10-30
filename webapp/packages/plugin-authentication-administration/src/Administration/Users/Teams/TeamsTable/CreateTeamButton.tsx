/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Button, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { CreateTeamService } from './CreateTeamService.js';
import { useTeamsTableContext } from './TeamsTableContext.js';

export const CreateTeamButton = observer(function CreateTeamButton() {
  const translate = useTranslate();
  const createTeamService = useService(CreateTeamService);
  const { table } = useTeamsTableContext();

  return (
    <Button
      variant="primary"
      title={translate('administration_teams_add_tooltip')}
      disabled={!!createTeamService.formState || table.processing}
      onClick={createTeamService.create}
    >
      {translate('administration_teams_create')}
    </Button>
  );
});
