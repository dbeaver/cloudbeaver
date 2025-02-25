/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Button, GroupItem, Textarea, UploadArea, useTranslate } from '@cloudbeaver/core-blocks';
import type { NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';
import { getTextFileReadingProcess } from '@cloudbeaver/core-utils';

interface Props {
  state: NetworkHandlerConfigInput;
  saved?: boolean;
  disabled?: boolean;
  readonly?: boolean;
}

// @TODO take it as a foundation for the core component TextUploader
export const SSHKeyUploader = observer<Props>(function SSHKeyUploader({ state, saved, disabled, readonly }) {
  const translate = useTranslate();

  async function handleKeyUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      throw new Error('File is not found');
    }

    const process = getTextFileReadingProcess(file);
    const key = await process.promise;

    if (key) {
      state.key = key;
    }
  }

  return (
    <>
      <Textarea
        name="key"
        state={state}
        disabled={disabled}
        readOnly={readonly}
        description={saved ? translate('ui_processing_saved') : undefined}
        required={state.savePassword && !saved}
        medium
      >
        {translate('connections_network_handler_ssh_tunnel_private_key')}
      </Textarea>
      <GroupItem>
        <UploadArea disabled={disabled || readonly} reset onChange={handleKeyUpload}>
          <Button tag="div" disabled={disabled || readonly} mod={['outlined']}>
            {translate('ui_file')}
          </Button>
        </UploadArea>
      </GroupItem>
    </>
  );
});
