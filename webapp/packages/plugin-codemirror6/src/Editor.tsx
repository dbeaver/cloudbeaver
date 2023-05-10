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

import { getDefaultExtensions } from './getDefaultExtensions';
import type { IEditorProps } from './IEditorProps';
import type { IEditorRef } from './IEditorRef';
import { ReactCodemirror } from './ReactCodemirror';
import { EDITOR_BASE_STYLES } from './theme';

export const Editor = observer(forwardRef<IEditorRef, IEditorProps>(function Editor(props, ref) {
  const extensions = [];
  const defaultExtensions = useMemo(() => {
    if (!props.extensions) {
      return getDefaultExtensions();
    }

    return [];
  }, [!props.extensions]);

  if (!props.extensions) {
    extensions.push(...defaultExtensions);
  } else {
    extensions.push(props.extensions);
  }

  return styled(EDITOR_BASE_STYLES)(
    <wrapper className={clsx('editor', props.className)}>
      <ReactCodemirror {...props} ref={ref} extensions={extensions} />
    </wrapper>
  );
}));