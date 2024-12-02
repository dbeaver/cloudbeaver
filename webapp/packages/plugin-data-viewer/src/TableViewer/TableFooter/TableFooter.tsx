/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import type { HTMLAttributes } from 'react';

import { Container, Fill, s, ToolsPanel, useS, useTranslate } from '@cloudbeaver/core-blocks';

import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel.js';
import styles from './TableFooter.module.css';
import { TableFooterMenu } from './TableFooterMenu/TableFooterMenu.js';

interface Props extends HTMLAttributes<HTMLDivElement> {
  resultIndex: number;
  model: IDatabaseDataModel;
  simple: boolean;
}

export const TableFooter = observer<Props>(function TableFooter({ resultIndex, model, simple, ...rest }) {
  const translate = useTranslate();
  const style = useS(styles);

  return (
    <ToolsPanel type="secondary" role="toolbar" center minHeight {...rest}>
      <TableFooterMenu model={model} resultIndex={resultIndex} simple={simple} />
      {model.source.requestInfo.requestMessage && (
        <>
          <Fill />
          <Container className={s(style, { time: true })} keepSize center>
            {translate(model.source.requestInfo.requestMessage)} - {model.source.requestInfo.requestDuration}
            {translate('ui_ms')}
          </Container>
        </>
      )}
    </ToolsPanel>
  );
});
