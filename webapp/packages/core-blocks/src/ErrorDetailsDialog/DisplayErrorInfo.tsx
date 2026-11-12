/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ReactElement } from 'react';

import { Textarea } from '../FormControls/Textarea.js';
import { Iframe } from '../Iframe.js';
import { useTranslate } from '../localization/useTranslate.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import style from './ErrorDetailsDialog.module.css';
import type { IErrorInfo } from './ErrorModel.js';

interface Props {
  error: IErrorInfo;
}

export function DisplayErrorInfo({ error }: Props): ReactElement {
  const styles = useS(style);
  const translate = useTranslate();

  return (
    <>
      <div className={s(styles, { property: true })}>
        {error.isHtml ? <Iframe srcDoc={error.message} /> : <div className={s(styles, { message: true })}>{translate(error.message)}</div>}
      </div>
      {error.stackTrace && (
        <div className={s(styles, { property: true })}>
          <Textarea className={s(styles, { textarea: true })} value={error.stackTrace} readOnly embedded />
        </div>
      )}
    </>
  );
}
