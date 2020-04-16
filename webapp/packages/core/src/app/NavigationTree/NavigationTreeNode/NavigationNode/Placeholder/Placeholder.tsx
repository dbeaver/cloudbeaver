/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled from 'reshadow';

import { placeholderStyles } from './placeholderStyles';

export function Placeholder({ className }: { className?: string }) {
  return styled(placeholderStyles)(
    <box as="div" className={className}>
      <div></div>
    </box>
  );
}
