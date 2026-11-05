/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import type { MouseEvent } from 'react';

import type { DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { Dialog, IconButton } from '@dbeaver/ui-kit';

import { Icon } from '../Icon.js';
import { useTranslate } from '../localization/useTranslate.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import classes from './ImageLightboxDialog.module.css';

export interface IImageLightboxDialogPayload {
  src: string;
  alt: string;
}

export const ImageLightboxDialog = observer<DialogComponentProps<IImageLightboxDialogPayload>>(function ImageLightboxDialog({
  payload,
  visible,
  rejectDialog,
}) {
  const styles = useS(classes);
  const translate = useTranslate();

  const closeLabel = translate('ui_close');

  const { src, alt } = payload;

  function close(): void {
    rejectDialog();
  }

  function handleBackgroundClick(event: MouseEvent<HTMLDivElement>): void {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  return (
    <Dialog
      className={s(styles, { lightbox: true })}
      aria-label={alt}
      open={visible}
      backdrop={false}
      unmountOnHide
      onClose={close}
      onClick={handleBackgroundClick}
    >
      <IconButton className={s(styles, { close: true })} type="button" variant="secondary" aria-label={closeLabel} title={closeLabel} onClick={close}>
        <Icon name="cross" width={20} height={20} />
      </IconButton>
      <img className={s(styles, { image: true })} src={src} alt={alt} decoding="async" />
    </Dialog>
  );
});
