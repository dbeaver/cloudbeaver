/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { s, useS, useTranslate } from '@cloudbeaver/core-blocks';

import type { IShortcut } from './IShortcut.js';
import styles from './Shortcut.module.css';

interface Props {
  shortcut: IShortcut;
}

export const Shortcut: React.FC<Props> = function Shortcut({ shortcut }) {
  const translate = useTranslate();
  const style = useS(styles);

  return (
    <div className={s(style, { shortcutContainer: true })}>
      <div className={s(style, { shortcutLabel: true })}>{translate(shortcut.label)}</div>
      <div className={s(style, { shortcutContent: true })}>
        {shortcut.code.map((code, index) => (
          <React.Fragment key={code}>
            {index > 0 && <span className={s(style, { span: true })}>{translate('ui_or')}</span>}
            <div className={s(style, { shortcutCode: true })}>{code}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
