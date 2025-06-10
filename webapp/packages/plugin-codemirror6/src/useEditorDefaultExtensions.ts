/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { Compartment, type Extension } from '@codemirror/state';
import {
  crosshairCursor,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
  tooltips,
} from '@codemirror/view';
import { classHighlighter } from '@lezer/highlight';
import { useRef } from 'react';

import { GlobalConstants, isObjectsEqual } from '@cloudbeaver/core-utils';
import { clsx } from '@dbeaver/ui-kit';

// @TODO allow to configure bindings outside of the component
const DEFAULT_KEY_MAP = defaultKeymap.filter(binding => binding.mac !== 'Ctrl-f' && binding.key !== 'Mod-Enter');

DEFAULT_KEY_MAP.push(indentWithTab);
DEFAULT_KEY_MAP.push({
  key: 'Mod-s',
  run: () => true,
});
DEFAULT_KEY_MAP.push(...searchKeymap);

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
  highlightSelectionMatches: true,
  highlightActiveLine: true,
  indentOnInput: true,
  rectangularSelection: true,
  keymap: true,
  lineWrapping: false,
  search: true,
};

export interface IDefaultExtensions {
  lineNumbers?: boolean;
  tooltips?: boolean;
  highlightSpecialChars?: boolean;
  syntaxHighlighting?: boolean;
  bracketMatching?: boolean;
  dropCursor?: boolean;
  crosshairCursor?: boolean;
  foldGutter?: boolean;
  highlightActiveLineGutter?: boolean;
  highlightSelectionMatches?: boolean;
  highlightActiveLine?: boolean;
  indentOnInput?: boolean;
  rectangularSelection?: boolean;
  keymap?: boolean;
  lineWrapping?: boolean;
  search?: boolean;
}

const extensionMap = {
  lineNumbers,
  tooltips: () => tooltips({ parent: document.body }),
  highlightSpecialChars,
  syntaxHighlighting: () => syntaxHighlighting(classHighlighter),
  bracketMatching,
  dropCursor,
  highlightSelectionMatches,
  crosshairCursor,
  foldGutter: () =>
    foldGutter({
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
  highlightActiveLineGutter,
  highlightActiveLine,
  indentOnInput,
  rectangularSelection,
  keymap: () => keymap.of(DEFAULT_KEY_MAP),
  lineWrapping: () => EditorView.lineWrapping,
};

const DEFAULT_EXTENSIONS_COMPARTMENT = new Compartment();

/** Provides the necessary extensions to establish a basic editor */
export function useEditorDefaultExtensions(options?: IDefaultExtensions): [Compartment, Extension] {
  const previousOptions = useRef(options);
  const isOptionsChanged = !isObjectsEqual(options, previousOptions.current);
  const extensions = useRef<[Compartment, Extension] | null>(null);

  if (isOptionsChanged || extensions.current === null) {
    previousOptions.current = options;
    extensions.current = createExtensions(options);
  }

  return extensions.current;
}

function createExtensions(options?: IDefaultExtensions): [Compartment, Extension] {
  const extensions = Object.entries(defaultExtensionsFlags)
    .filter(([key, isEnabled]) => options?.[key as keyof typeof options] ?? isEnabled)
    .map(([key]) => {
      const extensionFunction = extensionMap[key as keyof typeof extensionMap];
      return extensionFunction?.();
    })
    .filter(Boolean);
  return [DEFAULT_EXTENSIONS_COMPARTMENT, extensions];
}
