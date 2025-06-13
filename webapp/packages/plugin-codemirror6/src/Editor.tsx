/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef } from 'react';

import { s, useS } from '@cloudbeaver/core-blocks';

import type { IEditorProps } from './IEditorProps.js';
import type { IEditorRef } from './IEditorRef.js';
import { ReactCodemirror } from './ReactCodemirror.js';
import { EDITOR_BASE_STYLES } from './theme/index.js';
import { useCodemirrorExtensions } from './useCodemirrorExtensions.js';
import { type IDefaultExtensions, useEditorDefaultExtensions } from './useEditorDefaultExtensions.js';

export const Editor = observer<IEditorProps & IDefaultExtensions, IEditorRef>(
  forwardRef(function Editor(
    {
      extensions,
      lineNumbers,
      tooltips,
      highlightSpecialChars,
      syntaxHighlighting,
      bracketMatching,
      dropCursor,
      crosshairCursor,
      foldGutter,
      highlightActiveLineGutter,
      highlightSelectionMatches,
      highlightActiveLine,
      indentOnInput,
      rectangularSelection,
      keymap,
      lineWrapping,
      search,
      ...rest
    },
    ref,
  ) {
    useS(EDITOR_BASE_STYLES);
    extensions = useCodemirrorExtensions(extensions);

    const defaultExtensions = useEditorDefaultExtensions({
      lineNumbers,
      tooltips,
      highlightSpecialChars,
      syntaxHighlighting,
      bracketMatching,
      dropCursor,
      crosshairCursor,
      foldGutter,
      highlightActiveLineGutter,
      highlightSelectionMatches,
      highlightActiveLine,
      indentOnInput,
      rectangularSelection,
      keymap,
      lineWrapping,
      search,
    });

    extensions.set(...defaultExtensions);

    return (
      // all styles is global scoped so we can't get them from module
      <div className={s({ editor: 'editor' }, { editor: true }, rest.className)}>
        <ReactCodemirror {...rest} ref={ref} extensions={extensions} />
      </div>
    );
  }),
);
