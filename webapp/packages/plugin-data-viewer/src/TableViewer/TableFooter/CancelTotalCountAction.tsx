/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, IconButton, Loader, s, useS, useTranslate } from '@cloudbeaver/core-blocks';

import styles from './CancelTotalCountAction.m.css';

interface Props {
  onClick: VoidFunction;
  loading: boolean;
}

export const CancelTotalCountAction = observer<Props>(function CancelTotalCountAction({ onClick, loading }) {
  const translate = useTranslate();
  const style = useS(styles);

  function handleClick() {
    if (loading) {
      return;
    }

    onClick();
  }

  return (
    <Container
      className={s(style, { action: true })}
      title={translate(loading ? 'ui_processing_canceling' : 'ui_processing_cancel')}
      noWrap
      center
      zeroBasis
      keepSize
      onClick={handleClick}
    >
      {loading && <Loader className={s(style, { loader: true })} small />}
      {!loading && <IconButton disabled={loading} className={s(style, { icon: true })} name="cross" viewBox="0 0 32 32" />}
      <span className={s(style, { cancelText: true })}>{translate('ui_processing_cancel')}</span>
    </Container>
  );
});
