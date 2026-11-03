/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { ImageLightboxDialog } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { clsx } from '@dbeaver/ui-kit';

interface Props {
  source: string;
  name: string;
  className?: string;
}

export const AIChatAttachmentImage = observer<Props>(function AIChatAttachmentImage({ source, name, className }) {
  const commonDialogService = useService(CommonDialogService);

  function openImage(): void {
    void commonDialogService.open(ImageLightboxDialog, { src: source, alt: name });
  }

  return (
    <button
      className="tw:block tw:max-w-full tw:cursor-zoom-in tw:rounded-lg tw:border-0 tw:bg-transparent tw:p-0 tw:focus-visible:outline-2 tw:focus-visible:outline-solid tw:focus-visible:outline-(--theme-primary)"
      type="button"
      aria-haspopup="dialog"
      onClick={openImage}
    >
      <img className={clsx('tw:rounded-lg', className)} src={source} alt={name} title={name} decoding="async" loading="lazy" />
    </button>
  );
});
