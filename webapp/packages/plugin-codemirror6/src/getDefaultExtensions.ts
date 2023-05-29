/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { highlightSelectionMatches } from '@codemirror/search';
import type { Extension } from '@codemirror/state';
import {
  crosshairCursor,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
  tooltips,
} from '@codemirror/view';
import { classHighlighter } from '@lezer/highlight';

import { clsx, GlobalConstants } from '@cloudbeaver/core-utils';

// @TODO allow to configure bindings outside of the component
const DEFAULT_KEY_MAP = defaultKeymap.filter(binding => binding.mac !== 'Ctrl-f' && binding.key !== 'Mod-Enter');

DEFAULT_KEY_MAP.push(indentWithTab);

export interface IDefaultExtensions {
  lineNumbers?: boolean;
}

/** Provides the necessary extensions to establish a basic editor */
export function getDefaultExtensions(options?: IDefaultExtensions): Record<string, Extension> {
  let extensions: Record<string, Extension> = {
    tooltips: tooltips({
      parent: document.body,
    }),
    highlightSpecialChars: highlightSpecialChars(),
    highlightSelectionMatches: highlightSelectionMatches(),
    syntaxHighlighting: syntaxHighlighting(classHighlighter),
    bracketMatching: bracketMatching(),
    dropCursor: dropCursor(),
    crosshairCursor: crosshairCursor(),
    foldGutter: foldGutter({
      markerDOM: (open: boolean) => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttributeNS(null, 'viewBox', '0 0 15 8');
        svg.style.maxWidth = '100%';
        svg.style.maxHeight = '100%';

        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', GlobalConstants.absoluteUrl('/icons/icons.svg#angle'));
        svg.appendChild(use);

        const element = document.createElement('div');
        element.appendChild(svg);
        element.className = clsx('cm-gutterElement-icon', open ? 'cm-foldGutter-open' : 'cm-foldGutter-folded');

        return element;
      },
    }),
    highlightActiveLineGutter: highlightActiveLineGutter(),
    highlightActiveLine: highlightActiveLine(),
    indentOnInput: indentOnInput(),
    rectangularSelection: rectangularSelection(),
    keymap: keymap.of(DEFAULT_KEY_MAP),
  };

  if (options?.lineNumbers) {
    extensions = {
      lineNumbers: lineNumbers(),
      ...extensions,
    };
  }

  return extensions;
}
