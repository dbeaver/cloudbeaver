/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { Split } from 'go-split';

type SplitPropsWithRef = React.PropsWithRef<Split>;
interface UseAutoMarginArgs {
  ref?: React.MutableRefObject<Split | null>;
  split: SplitPropsWithRef['props']['split'];
  disableAutoMargin?: boolean;
  minSize?: number;
  maxSize?: number;
}

const DEFAULT_MIN_SIZE = 16;

export function useAutoMargin({ split, ref, disableAutoMargin, minSize, maxSize }: UseAutoMarginArgs) {
  const splitRef = ref?.current?.splitRef;
  const coords = splitRef?.current?.getBoundingClientRect();

  if (disableAutoMargin) {
    return {
      minSize,
      maxSize,
    };
  }

  if (!ref?.current || !splitRef || !coords) {
    return {
      // this case needed for initial render so divider also has a margin
      minSize: DEFAULT_MIN_SIZE,
      maxSize: window.innerWidth - DEFAULT_MIN_SIZE,
    };
  }

  const vertical = split === 'vertical' || split === undefined;
  const horizontal = split === 'horizontal';

  if (vertical) {
    minSize = DEFAULT_MIN_SIZE;
    maxSize = coords.width - DEFAULT_MIN_SIZE;
  }

  if (horizontal) {
    minSize = DEFAULT_MIN_SIZE;
    maxSize = coords.height - DEFAULT_MIN_SIZE;
  }

  return { minSize, maxSize };
}
