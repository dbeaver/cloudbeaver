/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, s, useResource, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { ICustomMenuItemComponent } from '@cloudbeaver/core-view';

import { TransactionManagerService } from '../TransactionManagerService.js';
import { createTransactionInfoParam } from './TRANSACTION_INFO_PARAM_SCHEMA.js';
import classes from './TransactionInfoAction.module.css';
import { TransactionLogsCountResource } from './TransactionLogsCountResource.js';

export const TransactionInfoAction: ICustomMenuItemComponent = observer(function TransactionInfoAction(props) {
  const styles = useS(classes);
  const transactionManagerService = useService(TransactionManagerService);
  const transaction = transactionManagerService.getActiveContextTransaction();
  const context = transaction?.context;
  const key = context ? createTransactionInfoParam(context.connectionId, context.projectId, context.id) : null;

  const transactionLogsCountResource = useResource(TransactionInfoAction, TransactionLogsCountResource, key);

  return (
    <Container className={s(styles, { container: true })} keepSize noGrow center onClick={() => props.item.events?.onSelect?.()}>
      <span className={s(styles, { count: true })}>{transactionLogsCountResource.data}</span>
    </Container>
  );
});
