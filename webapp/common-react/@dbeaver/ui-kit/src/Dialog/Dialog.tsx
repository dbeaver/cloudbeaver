/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  Dialog as AriakitDialog,
  DialogDescription as AriakitDialogDescription,
  DialogDisclosure as AriakitDialogDisclosure,
  DialogDismiss as AriakitDialogDismiss,
  DialogHeading as AriakitDialogHeading,
  DialogProvider,
  type DialogDescriptionProps,
  type DialogDismissProps,
  type DialogDisclosureProps,
  type DialogHeadingProps,
  type DialogProps,
  type DialogProviderProps,
  type DialogStore,
  type DialogStoreProps,
  type DialogStoreState,
  useDialogContext,
  useDialogStore,
} from '@ariakit/react';
import clsx from 'clsx';
import type { JSX } from 'react';

import './Dialog.css';

function Dialog({ className, backdrop, ...props }: DialogProps): JSX.Element {
  const backdropElement = backdrop === true ? <div className="dbv-kit-dialog__backdrop" /> : backdrop;

  return <AriakitDialog className={clsx('dbv-kit-dialog__content', className)} backdrop={backdropElement} {...props} />;
}

function DialogDisclosure({ className, ...props }: DialogDisclosureProps): JSX.Element {
  return <AriakitDialogDisclosure className={clsx('dbv-kit-dialog__disclosure', className)} {...props} />;
}

function DialogHeading({ className, ...props }: DialogHeadingProps): JSX.Element {
  return <AriakitDialogHeading className={clsx('dbv-kit-dialog__heading', className)} {...props} />;
}

function DialogDescription({ className, ...props }: DialogDescriptionProps): JSX.Element {
  return <AriakitDialogDescription className={clsx('dbv-kit-dialog__description', className)} {...props} />;
}

function DialogDismiss({ className, ...props }: DialogDismissProps): JSX.Element {
  return <AriakitDialogDismiss className={clsx('dbv-kit-dialog__dismiss', className)} {...props} />;
}

export {
  Dialog,
  DialogDisclosure,
  DialogHeading,
  DialogDescription,
  DialogDismiss,
  DialogProvider,
  useDialogStore,
  useDialogContext,
  type DialogProps,
  type DialogProviderProps,
  type DialogDisclosureProps,
  type DialogHeadingProps,
  type DialogDescriptionProps,
  type DialogDismissProps,
  type DialogStore,
  type DialogStoreProps,
  type DialogStoreState,
};
