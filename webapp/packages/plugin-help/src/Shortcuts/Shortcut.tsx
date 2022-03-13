/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import type { IShortcut } from './IShortcut';

interface Props {
  shortcut: IShortcut;
}

const style = css`
    shortcut-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    shortcut-label {
      margin-right: 8px;
    }
    shortcut-content {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    shortcut-code {
      composes: theme-form-element-radius theme-background-secondary theme-text-on-secondary from global;
      flex-shrink: 0;
      font-family: monospace;
      font-weight: bold;
      width: max-content;
      padding: 4px 8px;
    }
    span {
      white-space: nowrap;
      text-transform: lowercase;
    }
`;

export const Shortcut: React.FC<Props> = function Shortcut({ shortcut }) {
  const translate = useTranslate();

  return styled(useStyles(style))(
    <shortcut-container>
      <shortcut-label>
        {translate(shortcut.label)}
      </shortcut-label>
      <shortcut-content>
        {shortcut.code.map((code, index) => (
          <>
            {index > 0 && <span>{translate('ui_or')}</span>}
            <shortcut-code>
              {code}
            </shortcut-code>
          </>
        ))}
      </shortcut-content>
    </shortcut-container>
  );
};