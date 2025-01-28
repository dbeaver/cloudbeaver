/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { TeamMetaParametersResource } from '@cloudbeaver/core-authentication';
import { Group, GroupTitle, ObjectPropertyInfoForm, useResource, useTranslate } from '@cloudbeaver/core-blocks';

import type { ITeamOptionsState } from './ITeamOptionsState.js';

interface IProps {
  state: ITeamOptionsState;
  disabled: boolean;
}

export const TeamMetaParameters = observer<IProps>(function TeamMetaParameters({ state, disabled }) {
  const teamMetaParameters = useResource(TeamMetaParameters, TeamMetaParametersResource, undefined);
  const translate = useTranslate();

  if (teamMetaParameters.data.length === 0) {
    return null;
  }

  return (
    <Group small gap vertical overflow>
      <GroupTitle keepSize>{translate('authentication_team_meta_parameters')}</GroupTitle>
      <ObjectPropertyInfoForm state={state.metaParameters} properties={teamMetaParameters.data} disabled={disabled} keepSize tiny />
    </Group>
  );
});
