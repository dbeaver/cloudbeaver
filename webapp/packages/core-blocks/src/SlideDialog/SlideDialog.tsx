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
  persistentPanelIds?: string[];
  onClose: () => void;
  children: React.ReactNode;
}

export const SlideDialog = observer<SlideDialogProps>(function SlideDialog({ open, persistentPanelIds, onClose, children }) {
  const t = useTranslate();
  const overlayRef = useRef<HTMLDivElement>(null);

  const getPersistentElements = useCallback(() => {
    const elements: Element[] = [];
    const header = document.querySelector('header');
    if (header) {
      elements.push(header);
    }
    if (persistentPanelIds) {
      for (const id of persistentPanelIds) {
        const panel = document.querySelector(`[data-panel-id="${id}"]`);
        if (panel) {
          elements.push(panel);
        }
      }
    }
    const notifications = document.querySelectorAll('.__reakit-portal');
    notifications.forEach(notification => elements.push(notification));
    const dialogs = document.querySelectorAll('[data-dialog]');
    dialogs.forEach(dialog => elements.push(dialog));
    if (overlayRef.current) {
      elements.push(overlayRef.current);
    }
    return elements;
  }, [persistentPanelIds]);

  return (
    <>
      <div ref={overlayRef} className="dbv-slide-dialog__overlay" data-active={open || undefined} onClick={onClose} />
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
