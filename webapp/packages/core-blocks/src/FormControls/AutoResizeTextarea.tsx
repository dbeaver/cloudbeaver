/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useLayoutEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';

import { Textarea, type TextareaControlledProps, type TextareaObjectProps } from './Textarea.js';
import { useS } from '../useS.js';
import { useMergeRefs } from '../useMergeRefs.js';
import { s } from '../s.js';
import style from './AutoResizeTextarea.module.css';

interface Props {
  (props: TextareaControlledProps): React.JSX.Element;
  <TKey extends keyof TState, TState>(props: TextareaObjectProps<TKey, TState>): React.JSX.Element;
}

export const AutoResizeTextarea: Props = observer(function AutoResizeTextarea({
  ref,
  name,
  value: controlledValue,
  state,
  className,
  ...rest
}: TextareaControlledProps | TextareaObjectProps<any, any>) {
  const styles = useS(style);
  const innerRef = useRef<HTMLTextAreaElement | null>(null);

  const value = state ? state[name] : controlledValue;

  const adjustHeight = useCallback(() => {
    const el = innerRef.current;

    if (!el) {
      return;
    }

    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      adjustHeight();
    });

    return () => cancelAnimationFrame(frame);
  }, [value, adjustHeight]);

  const mergedRef = useMergeRefs(...[innerRef, ref!].filter(Boolean));

  return (
    <Textarea ref={mergedRef} {...rest} name={name} value={controlledValue} state={state} className={s(styles, { autoResize: true }, className)} />
  );
});
