/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useLayoutEffect, useRef } from 'react';

type Ref = HTMLElement | React.RefObject<HTMLElement> | null;

export const INVALID_CLASSNAME = 'user-invalid';

export function useValidationStyles(inputRef: Ref) {
  const prevRef = useRef<Ref>(inputRef);
  const invalidHandler = handlerFabric(inputRef, INVALID_CLASSNAME, 'add');
  const changedHandler = handlerFabric(inputRef, INVALID_CLASSNAME, 'remove');
  const invalidPrevHandler = handlerFabric(prevRef.current, INVALID_CLASSNAME, 'add');
  const changedPrevHandler = handlerFabric(prevRef.current, INVALID_CLASSNAME, 'remove');

  useLayoutEffect(() => {
    if (prevRef.current !== inputRef) {
      unsubscribe(prevRef.current, invalidPrevHandler, changedPrevHandler);
      prevRef.current = inputRef;
    }

    subscribe(inputRef, invalidHandler, changedHandler);

    return () => {
      unsubscribe(inputRef, invalidHandler, changedHandler);
    };
  }, [inputRef]);
}

function handlerFabric(ref: Ref, className: string, action: 'add' | 'remove') {
  return () => {
    if (ref instanceof HTMLElement) {
      ref.classList[action](className);
      return;
    }

    ref?.current?.classList[action](className);
  };
}

function subscribe(ref: Ref, invalidHandler: VoidFunction, clearHandler: VoidFunction) {
  if (ref instanceof HTMLElement) {
    ref?.addEventListener('invalid', invalidHandler, false);
    ref?.addEventListener('change', clearHandler, false);
    ref?.addEventListener('submit', clearHandler, false);
    return;
  }

  ref?.current?.addEventListener('invalid', invalidHandler, false);
  ref?.current?.addEventListener('change', clearHandler, false);
  ref?.current?.addEventListener('submit', clearHandler, false);
}

function unsubscribe(ref: Ref, invalidHandler: VoidFunction, clearHandler: VoidFunction) {
  if (ref instanceof HTMLElement) {
    ref?.removeEventListener('invalid', invalidHandler, false);
    ref?.removeEventListener('change', clearHandler, false);
    ref?.removeEventListener('submit', clearHandler, false);
    return;
  }

  ref?.current?.removeEventListener('invalid', invalidHandler, false);
  ref?.current?.removeEventListener('change', clearHandler, false);
  ref?.current?.removeEventListener('submit', clearHandler, false);
}
