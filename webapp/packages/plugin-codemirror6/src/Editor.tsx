/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import type { IEditorProps } from './IEditorProps';
import { ReactCodemirror } from './ReactCodemirror';

export const Editor: React.FC<IEditorProps> = observer(function Editor({
  className,
  ...props
}) {
  return (
    <wrapper className={className}>
      <ReactCodemirror {...props} />
    </wrapper>
  );
});