/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { Container, IconButton, useTranslate } from '@cloudbeaver/core-blocks';

import styles from './CancelTotalCountAction.m.css';
import { tableFooterMenuStyles } from './TableFooterMenu/TableFooterMenuItem';

interface Props {
  onClick: VoidFunction;
}

export const CancelTotalCountAction = observer(function CancelTotalCountAction({ onClick }: Props) {
  const translate = useTranslate();

  return styled(tableFooterMenuStyles)(
    <Container className={styles.action} title={translate('ui_processing_cancel')} noWrap center zeroBasis keepSize onClick={onClick}>
      <IconButton className={styles.icon} name="cross" title={translate('ui_processing_cancel')} viewBox="0 0 32 32" />
      <span className={styles.cancelText}>{translate('ui_processing_cancel')}</span>
    </Container>,
  );
});
