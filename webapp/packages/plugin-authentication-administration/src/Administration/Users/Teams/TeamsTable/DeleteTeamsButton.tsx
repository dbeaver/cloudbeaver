/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Button, useTranslate } from '@cloudbeaver/core-blocks';

import { useTeamsTableContext } from './TeamsTableContext.js';

export const DeleteTeamsButton = observer(function DeleteTeamsButton() {
  const translate = useTranslate();
  const { table, selection } = useTeamsTableContext();

  return (
    <Button
      variant="secondary"
      className="tw:normal-case! tw:tracking-normal! tw:font-semibold"
      title={translate('administration_teams_delete_tooltip')}
      icon="trash"
      iconPlacement="start"
      viewBox="0 0 24 24"
      disabled={!selection.list.length || table.processing}
      onClick={table.delete}
    >
      {translate('ui_delete')}
    </Button>
  );
});
