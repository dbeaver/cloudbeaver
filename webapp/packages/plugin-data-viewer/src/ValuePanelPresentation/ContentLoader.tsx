/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Button } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';

interface Props {
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onLoad: () => void;
}

const style = css`
  loader {
    margin: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }
  loader-label {
    text-align: center;
  }
`;

export const ContentLoader = observer<Props>(function ContentLoader({ disabled, loading, className, onLoad, children }) {
  const translate = useTranslate();
  return styled(style)(
    <loader className={className}>
      <loader-label>{children}</loader-label>
      <Button
        disabled={disabled}
        loading={loading}
        onClick={onLoad}
      >
        {translate('ui_download')}
      </Button>
    </loader>
  );
});