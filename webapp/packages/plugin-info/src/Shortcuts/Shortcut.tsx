/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-localization';

import type { IShortcut } from './IShortcut';
import { ShortcutBody } from './ShortcutBody';

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
`;

export const Shortcut: React.FC<Props> = function Shortcut({ shortcut }) {
  const translate = useTranslate();

  return styled(style)(
    <shortcut-container>
      <shortcut-label>
        {translate(shortcut.label)}
      </shortcut-label>
      <ShortcutBody body={shortcut.body} />
    </shortcut-container>
  );
};