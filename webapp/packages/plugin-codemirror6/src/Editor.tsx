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
import { LANG_EXT } from './LANG_EXT';
import { ReactCodemirror } from './ReactCodemirror';
import { EDITOR_BASE_STYLES } from './theme';
import { useAutoFormat } from './useAutoFormat';

export const Editor = observer(forwardRef<IEditorRef, IEditorProps>(function Editor(props, ref) {
  const formatter = useAutoFormat(props.mode);

  let value = props.value;

  if (props.autoFormat) {
    value = formatter.format(value);
  }

  const extensions = [...props.extensions ?? []];

  if (props.mode) {
    extensions.push(LANG_EXT[props.mode]());
  }

  return styled(EDITOR_BASE_STYLES)(
    <wrapper className={['editor', props.className].join(' ')}>
      <ReactCodemirror {...props} ref={ref} extensions={extensions} value={value} />
    </wrapper>
  );
}));