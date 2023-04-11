/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { forwardRef } from 'react';
import styled from 'reshadow';

import type { IEditorProps } from './IEditorProps';
import type { IEditorRef } from './IEditorRef';
import { ReactCodemirror } from './ReactCodemirror';
import { EDITOR_BASE_STYLES } from './theme';

export const Editor = observer(forwardRef<IEditorRef, IEditorProps>(function Editor(props, ref) {
  return styled(EDITOR_BASE_STYLES)(
    <wrapper className='editor'>
      <ReactCodemirror {...props} ref={ref} />
    </wrapper>
  );
}));