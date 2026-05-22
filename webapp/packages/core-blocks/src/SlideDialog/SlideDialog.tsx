/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useRef } from 'react';

import { Dialog, IconButton } from '@dbeaver/ui-kit';

import { Icon } from '../Icon.js';
import { Loader } from '../Loader/Loader.js';
import { SLIDE_PANEL_CLOSE_BUTTON_ID } from '../SLIDE_PANEL_CLOSE_BUTTON_ID.js';
import { useTranslate } from '../localization/useTranslate.js';
import './SlideDialog.css';

export interface SlideDialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const SlideDialog = observer<SlideDialogProps>(function SlideDialog({ open, onClose, children }) {
  const t = useTranslate();
  const overlayRef = useRef<HTMLDivElement>(null);

  // We need to specify persistent elements for the dialog to make them accessible when the dialog is open.
  // To add an element to the list of persistent elements, add the `data-dialog-persistent-element` attribute to it.
  const getPersistentElements = useCallback(() => {
    const dialogs = document.querySelectorAll('[data-dialog]');
    const persistentElements = document.querySelectorAll('[data-dialog-persistent-element]');

    return [...dialogs, ...persistentElements];
  }, []);

  return (
    <>
      <div ref={overlayRef} className="dbv-slide-dialog__overlay" data-active={open || undefined} data-dialog-persistent-element onClick={onClose} />
      <Dialog
        open={open}
        data-variant="slide"
        portal={false}
        backdrop={false}
        preventBodyScroll={false}
        hideOnInteractOutside={false}
        getPersistentElements={getPersistentElements}
        className="dbv-slide-dialog__dialog"
        onClose={onClose}
      >
        <IconButton
          id={SLIDE_PANEL_CLOSE_BUTTON_ID}
          size="small"
          aria-label={t('core_blocks_dialog_element_close_tooltip')}
          className="dbv-slide-dialog__close-btn"
          onClick={onClose}
        >
          <Icon name="cross" viewBox="0 0 24 24" />
        </IconButton>
        <Loader className="dbv-slide-dialog__loader" suspense>
          {children}
        </Loader>
      </Dialog>
    </>
  );
});
