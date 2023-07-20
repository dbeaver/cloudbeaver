/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Loader } from '@cloudbeaver/core-blocks';

import type { ISqlDataSource } from './SqlDataSource/ISqlDataSource';

const viewerStyles = css`
  Loader {
    composes: theme-background-surface theme-border-color-background from global;

    position: absolute;
    bottom: 0px;

    border-top: 1px solid;
    width: 100%;
    padding: 0 8px;
    box-sizing: border-box;
  }
`;

interface Props {
  dataSource: ISqlDataSource | undefined;
}

export const SqlEditorStatusBar = observer<Props>(function SqlEditorStatusBar({ dataSource }) {
  return styled(viewerStyles)(<Loader state={dataSource} message={dataSource?.message} inline inlineException />);
});
