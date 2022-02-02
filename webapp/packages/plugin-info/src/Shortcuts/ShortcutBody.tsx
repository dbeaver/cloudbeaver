/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-localization';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import type { IShortcutBody } from './IShortcut';

interface Props {
  body: IShortcutBody;
}

const style = composes(
  css`
    shortcut-code {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
  `,
  css`
    shortcut-body {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    shortcut-code {
      flex-shrink: 0;
      font-family: monospace;
      font-weight: bold;
      border-radius: 4px;
      width: max-content;
      padding: 4px 8px;
    }
    span {
      white-space: nowrap;
      text-transform: lowercase;
    }
`);

export const ShortcutBody: React.FC<Props> = function ShortcutBody({ body }) {
  const translate = useTranslate();
  const styles = useStyles(style);

  return styled(styles)(
    <shortcut-body>
      <shortcut-code>
        {body.code}
      </shortcut-code>
      {body.and && (
        <>
          <span>+</span>
          <ShortcutBody body={body.and} />
        </>
      )}
      {body.or && (
        <>
          <span>{translate('ui_or')}</span>
          <ShortcutBody body={body.or} />
        </>
      )}
    </shortcut-body>
  );
};