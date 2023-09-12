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

import { clsx } from '@cloudbeaver/core-utils';

import type { IEditorProps } from './IEditorProps';
import type { IEditorRef } from './IEditorRef';
import { ReactCodemirror } from './ReactCodemirror';
import { EDITOR_BASE_STYLES } from './theme';
import { useCodemirrorExtensions } from './useCodemirrorExtensions';
import { type IDefaultExtensions, useEditorDefaultExtensions } from './useEditorDefaultExtensions';

const defaultExtensionsFlags: IDefaultExtensions = {
  lineNumbers: false,
  tooltips: true,
  highlightSpecialChars: true,
  syntaxHighlighting: true,
  bracketMatching: true,
  dropCursor: true,
  crosshairCursor: true,
  foldGutter: true,
  highlightActiveLineGutter: true,
  highlightActiveLine: true,
  indentOnInput: true,
  rectangularSelection: true,
  keymap: true,
};

export const Editor = observer<IEditorProps & IDefaultExtensions, IEditorRef>(
  forwardRef(function Editor({ extensions, ...rest }, ref) {
    extensions = useCodemirrorExtensions(extensions);

    const defaultExtensions = useEditorDefaultExtensions({
      ...defaultExtensionsFlags,
      ...rest,
    });

    extensions.set(...defaultExtensions);

    return styled(EDITOR_BASE_STYLES)(
      <wrapper className={clsx('editor', rest.className)}>
        <ReactCodemirror {...rest} ref={ref} extensions={extensions} />
      </wrapper>,
    );
  }),
);
