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
import type { ComponentPropsWithoutRef, JSX } from 'react';

import './Dialog.css';

interface ExtendedDialogProps extends DialogProps {
  animated?: boolean;
}

function Dialog({ className, backdrop, animated = true, ...props }: ExtendedDialogProps): JSX.Element {
  const backdropElement = backdrop === true ? <div className="dbv-kit-dialog__backdrop" data-animated={animated} /> : backdrop;

  return <AriakitDialog className={clsx('dbv-kit-dialog', className)} backdrop={backdropElement} data-animated={animated} {...props} />;
}

function DialogDisclosure({ className, ...props }: DialogDisclosureProps): JSX.Element {
  return <AriakitDialogDisclosure className={clsx('dbv-kit-dialog__disclosure', className)} {...props} />;
}

function DialogHeader({ className, ...props }: ComponentPropsWithoutRef<'header'>): JSX.Element {
  return <header className={clsx('dbv-kit-dialog__header', className)} {...props} />;
}

function DialogBody({ className, ...props }: ComponentPropsWithoutRef<'div'>): JSX.Element {
  return <div className={clsx('dbv-kit-dialog__body', className)} {...props} />;
}

function DialogFooter({ className, ...props }: ComponentPropsWithoutRef<'footer'>): JSX.Element {
  return <footer className={clsx('dbv-kit-dialog__footer', className)} {...props} />;
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
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogHeading,
  DialogDescription,
  DialogDismiss,
  DialogProvider,
  useDialogStore,
  useDialogContext,
  type ExtendedDialogProps as DialogProps,
  type DialogProviderProps,
  type DialogDisclosureProps,
  type DialogHeadingProps,
  type DialogDescriptionProps,
  type DialogDismissProps,
  type DialogStore,
  type DialogStoreProps,
  type DialogStoreState,
};
