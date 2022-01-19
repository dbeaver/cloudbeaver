/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css, use } from 'reshadow';

const styles = css`
  box-element {
    flex-basis: 550px;
    flex-grow: 1;

    &[|max] {
      width: 100%;
    }
  }
`;

interface Props {
  className?: string;
  max?: boolean;
}

export const FormBoxElement: React.FC<Props> = function FormBoxElement({ children, className, max }) {
  return styled(styles)(
    <box-element as='div' className={className} {...use({ max })}>
      {children}
    </box-element>
  );
};
