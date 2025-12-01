/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Dialog, DialogDescription, DialogDisclosure, DialogDismiss, DialogHeading, DialogProvider, useDialogStore, Button } from '@dbeaver/ui-kit';
import { Meta } from '@storybook/react-vite';
import { useState } from 'react';

const meta = {
  component: Dialog,
} satisfies Meta<typeof Dialog>;

export default meta;

export function Default(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <Dialog open={open} onClose={() => setOpen(false)} data-size="medium">
        <DialogHeading>Dialog Title</DialogHeading>
        <DialogDescription>This is a simple dialog component with basic content.</DialogDescription>
        <div className="tw:mt-4">
          <DialogDismiss>Close</DialogDismiss>
        </div>
      </Dialog>
    </>
  );
}

export function WithProvider(): JSX.Element {
  const dialog = useDialogStore();

  return (
    <DialogProvider store={dialog}>
      <DialogDisclosure>
        <Button>Open Dialog with Provider</Button>
      </DialogDisclosure>
      <Dialog data-size="medium">
        <DialogHeading>Dialog with Provider</DialogHeading>
        <DialogDescription>This dialog is managed by DialogProvider using useDialogStore hook.</DialogDescription>
        <div className="tw:mt-4">
          <DialogDismiss>Close</DialogDismiss>
        </div>
      </Dialog>
    </DialogProvider>
  );
}

export function WithMultipleActions(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <Dialog open={open} onClose={() => setOpen(false)} data-size="medium">
        <DialogHeading>Confirm Action</DialogHeading>
        <DialogDescription>Are you sure you want to proceed with this action? This action cannot be undone.</DialogDescription>
        <div className="tw:mt-4 tw:flex tw:gap-2 tw:justify-end">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => setOpen(false)}>
            Confirm
          </Button>
        </div>
      </Dialog>
    </>
  );
}

export function WithScrollableContent(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Dialog with Scroll</Button>
      <Dialog open={open} onClose={() => setOpen(false)} data-size="large">
        <DialogHeading>Long Content Dialog</DialogHeading>
        <DialogDescription>
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="tw:py-2">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </div>
          ))}
        </DialogDescription>
        <div className="tw:mt-4">
          <DialogDismiss>Close</DialogDismiss>
        </div>
      </Dialog>
    </>
  );
}

export function SmallSize(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Small Dialog</Button>
      <Dialog open={open} onClose={() => setOpen(false)} data-size="small">
        <DialogHeading>Small Dialog</DialogHeading>
        <DialogDescription>This is a small dialog (404x262px)</DialogDescription>
        <div className="tw:mt-4">
          <DialogDismiss>Close</DialogDismiss>
        </div>
      </Dialog>
    </>
  );
}

export function SlideVariant(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Slide Panel</Button>
      <Dialog open={open} data-variant="slide" onClose={() => setOpen(false)}>
        <div className="tw:p-6">
          <DialogHeading>Slide Panel</DialogHeading>
          <DialogDescription>
            This is a slide panel that appears from the right side of the screen, covering almost the entire viewport (leaving 120px on the left).
            <br />
            <br />
            Perfect for detailed forms, settings panels, or any content that needs more space than a regular dialog.
          </DialogDescription>
          <div className="tw:mt-4 tw:flex tw:gap-2">
            <Button variant="primary" onClick={() => setOpen(false)}>
              Save Changes
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
