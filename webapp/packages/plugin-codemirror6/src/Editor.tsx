/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { forwardRef, useMemo } from 'react';
import styled from 'reshadow';

import { clsx } from '@cloudbeaver/core-utils';

import { getDefaultExtensions, IDefaultExtensions } from './getDefaultExtensions';
import type { IEditorProps } from './IEditorProps';
import type { IEditorRef } from './IEditorRef';
import { ReactCodemirror } from './ReactCodemirror';
import { EDITOR_BASE_STYLES } from './theme';

export const Editor = observer<IEditorProps & IDefaultExtensions, IEditorRef>(forwardRef(function Editor({
  lineNumbers,
  extensions,
  ...rest
}, ref) {
  const combinedExtensions = [];
  const defaultExtensions = useMemo(() => {
    if (!extensions) {
      return getDefaultExtensions({ lineNumbers });
    }

    return [];
  }, [!extensions, lineNumbers]);

  if (!extensions) {
    combinedExtensions.push(...defaultExtensions);
  } else {
    combinedExtensions.push(extensions);
  }

  return styled(EDITOR_BASE_STYLES)(
    <wrapper className={clsx('editor', rest.className)}>
      <ReactCodemirror {...rest} ref={ref} extensions={combinedExtensions} />
    </wrapper>
  );
}));