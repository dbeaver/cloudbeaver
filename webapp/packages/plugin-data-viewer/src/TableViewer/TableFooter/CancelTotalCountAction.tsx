/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { ToolsAction, useTranslate } from '@cloudbeaver/core-blocks';

import { tableFooterMenuStyles } from './TableFooterMenu/TableFooterMenuItem';
import classes from './TableFooterRowCount.m.css';

export const CancelTotalCountAction = observer(function CancelTotalCountAction({ onClick }: { onClick: VoidFunction }) {
  const translate = useTranslate();

  return styled(tableFooterMenuStyles)(
    <div className={classes.wrapper} title={translate('ui_processing_cancel')}>
      <ToolsAction icon="/icons/data_cancel.svg" viewBox="0 0 32 32" onClick={onClick}>
        {translate('ui_processing_cancel')}
      </ToolsAction>
    </div>,
  );
});
