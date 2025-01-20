/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, s, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { ICustomMenuItemComponent } from '@cloudbeaver/core-view';

import { TransactionManagerService } from '../TransactionManagerService.js';
import { createTransactionInfoParam } from './TRANSACTION_INFO_PARAM_SCHEMA.js';
import classes from './TransactionInfoAction.module.css';
import { TransactionLogCountResource } from './TransactionLogCountResource.js';

export const TransactionInfoAction: ICustomMenuItemComponent = observer(function TransactionInfoAction(props) {
  const styles = useS(classes);
  const translate = useTranslate();
  const transactionManagerService = useService(TransactionManagerService);
  const transaction = transactionManagerService.getActiveContextTransaction();
  const context = transaction?.context;
  const key = context ? createTransactionInfoParam(context.connectionId, context.projectId, context.id) : null;

  const transactionLogCountResource = useResource(TransactionInfoAction, TransactionLogCountResource, key);
  const count =
    transactionLogCountResource.data === 0 ? translate('plugin_datasource_transaction_manager_logs_counter_none') : transactionLogCountResource.data;

  let title: string = translate('plugin_datasource_transaction_manager_logs_tooltip');

  if (transactionLogCountResource.data) {
    title = `${title}\n${translate('plugin_datasource_transaction_manager_logs_tooltip_count', undefined, { count })}`;
  }

  return (
    <Container className={s(styles, { container: true })} title={title} keepSize noGrow center onClick={() => props.item.events?.onSelect?.()}>
      <span className={s(styles, { count: true })}>{count}</span>
    </Container>
  );
});
