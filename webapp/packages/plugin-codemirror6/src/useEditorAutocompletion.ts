import type React from 'react';
import { useLayoutEffect, useState } from 'react';
import { css } from 'reshadow';

import type { ComponentStyle } from '@cloudbeaver/core-theming';
import { clsx } from '@cloudbeaver/core-utils';
import { autocompletion, startCompletion } from '@codemirror/autocomplete';
import type { Extension, EditorState } from '@codemirror/state';
import { keymap } from '@codemirror/view';

import type { IEditorRef } from './IEditorRef';

const styles = css`
  :global(.cm-fix-position) {
    margin-left: var(--cm-fix-position-left);
    margin-top: var(--cm-fix-position-top);
    z-index: 100;
  }
  :global(.cm-fixed-point) {
    position: fixed;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
  }
`;

export type UseEditorAutocompletionResult = [Extension, React.ForwardedRef<IEditorRef>, ComponentStyle];

export function useEditorAutocompletion(config?: Parameters<typeof autocompletion>[0]): UseEditorAutocompletionResult {
  const [editor, setEditor] = useState<IEditorRef | null>(null);

  useLayoutEffect(() => {
    const container = editor?.container;

    if (!container) {
      return;
    }

    // we need this element to calculate the position of the autocompletion tooltip
    // because codemirror fixed position is incorrect in case of translated container
    let element = container.querySelector<HTMLDivElement>('.cm-fixed-point');

    if (!element) {
      element = document.createElement('div');
      element.className = 'cm-fixed-point';
      container.append(element);
    }

    const resizeObserver = new ResizeObserver(() => {
      if (!element) {
        return;
      }

      let top = 0;
      let left = 0;

      // if (!isSafari) {
      // seems like it's not working on iPad OS
      const viewportOffset = element.getBoundingClientRect();
      top = Math.floor(viewportOffset.top);
      left = Math.floor(viewportOffset.left);
      // }

      container.style.setProperty('--cm-fix-position-top', `${-top}px`);
      container.style.setProperty('--cm-fix-position-left', `${-left}px`);
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  });

  return [
    [
      autocompletion({
        ...config,
        tooltipClass: (state: EditorState) => clsx(config?.tooltipClass?.(state), 'cm-fix-position'),
        closeOnBlur: false,
      }),
      keymap.of([
        { key: 'Alt-Space', run: startCompletion, preventDefault: true },
        { key: 'Shift-Ctrl-Space', run: startCompletion, preventDefault: true },
      ]),
    ],
    setEditor,
    styles,
  ];
}
