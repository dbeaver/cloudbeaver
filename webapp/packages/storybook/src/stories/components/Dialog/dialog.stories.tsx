/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  Dialog,
  DialogBody,
  DialogDescription,
  DialogDisclosure,
  DialogDismiss,
  DialogFooter,
  DialogHeader,
  DialogHeading,
  DialogProvider,
  useDialogStore,
  Button,
} from '@dbeaver/ui-kit';
import { Meta } from '@storybook/react-vite';
import { JSX, useState } from 'react';

const meta = {
  component: Dialog,
} satisfies Meta<typeof Dialog>;

export default meta;

export function Default(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <Dialog open={open} data-size="medium" onClose={() => setOpen(false)}>
        <DialogHeader>
          <DialogHeading>Dialog Title</DialogHeading>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>This is a simple dialog component with basic content using the new layout system.</DialogDescription>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setOpen(false)}>
            Confirm
          </Button>
        </DialogFooter>
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
        <DialogHeader>
          <DialogHeading>Dialog with Provider</DialogHeading>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>This dialog is managed by DialogProvider using useDialogStore hook.</DialogDescription>
        </DialogBody>
        <DialogFooter>
          <DialogDismiss>Close</DialogDismiss>
        </DialogFooter>
      </Dialog>
    </DialogProvider>
  );
}

export function WithMultipleActions(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <Dialog open={open} data-size="medium" onClose={() => setOpen(false)}>
        <DialogHeader>
          <DialogHeading>Confirm Action</DialogHeading>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>Are you sure you want to proceed with this action? This action cannot be undone.</DialogDescription>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => setOpen(false)}>
            Confirm
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

export function WithScrollableContent(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Dialog with Scroll</Button>
      <Dialog open={open} data-size="large" onClose={() => setOpen(false)}>
        <DialogHeader>
          <DialogHeading>Long Content Dialog</DialogHeading>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="tw:py-2">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </div>
            ))}
          </DialogDescription>
        </DialogBody>
        <DialogFooter>
          <DialogDismiss>Close</DialogDismiss>
        </DialogFooter>
      </Dialog>
    </>
  );
}

export function SmallSize(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Small Dialog</Button>
      <Dialog open={open} data-size="small" onClose={() => setOpen(false)}>
        <DialogHeader>
          <DialogHeading>Small Dialog</DialogHeading>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>This is a small dialog (404x262px)</DialogDescription>
        </DialogBody>
        <DialogFooter>
          <DialogDismiss>Close</DialogDismiss>
        </DialogFooter>
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

export function NestedDialogs(): JSX.Element {
  const [formValue, setFormValue] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);

  // Reset the form value whenever the dialog is closed
  if (!formOpen && formValue) {
    setFormValue('');
  }

  return (
    <>
      <Button onClick={() => setFormOpen(true)}>Create Post</Button>
      <Dialog
        autoFocusOnShow={!warningOpen}
        open={formOpen}
        data-size="medium"
        backdrop
        onClose={event => {
          // If there's unsaved content, show warning dialog instead of closing
          if (formValue.trim()) {
            event.preventDefault();
            setWarningOpen(true);
          } else {
            setFormOpen(false);
          }
        }}
      >
        <DialogHeader>
          <DialogHeading>Create Post</DialogHeading>
        </DialogHeader>
        <DialogBody>
          <form
            onSubmit={event => {
              event.preventDefault();
              setFormOpen(false);
            }}
          >
            <label className="tw:block">
              <span className="tw:text-sm tw:font-medium tw:mb-2 tw:block">What&apos;s on your mind?</span>
              <textarea
                rows={5}
                className="tw:w-full tw:px-3 tw:py-2 tw:border tw:border-gray-300 tw:rounded tw:resize-none focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-blue-500"
                placeholder="Share your thoughts..."
                value={formValue}
                autoFocus
                onChange={event => setFormValue(event.target.value)}
              />
            </label>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setFormOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!formValue.trim()} onClick={() => setFormOpen(false)}>
            Post
          </Button>
        </DialogFooter>

        {/* Nested warning dialog */}
        <Dialog open={warningOpen} data-size="small" backdrop onClose={() => setWarningOpen(false)}>
          <DialogHeader>
            <DialogHeading>Save post?</DialogHeading>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>You can save this to send later from your drafts, or discard it.</DialogDescription>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setFormValue('');
                setWarningOpen(false);
                setFormOpen(false);
              }}
            >
              Discard
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setWarningOpen(false);
                setFormOpen(false);
              }}
            >
              Save Draft
            </Button>
          </DialogFooter>
        </Dialog>
      </Dialog>
    </>
  );
}

export function WithoutAnimation(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Dialog (No Animation)</Button>
      <Dialog open={open} animated={false} data-size="medium" onClose={() => setOpen(false)}>
        <DialogHeader>
          <DialogHeading>Dialog Without Animation</DialogHeading>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>
            This dialog has animations disabled using the <code>animated={'{false}'}</code> prop. This is useful when combining the dialog with other
            animations (e.g., SlideElement) to avoid animation conflicts.
          </DialogDescription>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setOpen(false)}>
            Confirm
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
