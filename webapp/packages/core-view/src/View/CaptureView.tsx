/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import styled, { css } from 'reshadow';

import { useFocus } from '@cloudbeaver/core-blocks';

import { CaptureViewContext } from './CaptureViewContext';
import type { IView } from './IView';
import { useActiveView } from './useActiveView';

const styles = css`
  div {
    outline: none;
  }
`;

interface Props {
  view: IView<any>;
  className?: string;
}

export const CaptureView = observer<Props>(function CaptureView({
  view,
  children,
  className,
}) {
  const [onFocus, onBlur] = useActiveView(view);
  const [ref] = useFocus<HTMLDivElement>({ onFocus, onBlur });

  const context = useMemo(() => ({
    view,
  }), [view]);

  return styled(styles)(
    <CaptureViewContext.Provider value={context}>
      <div ref={ref} className={className} tabIndex={0}>
        {children}
      </div>
    </CaptureViewContext.Provider>
  );
});
