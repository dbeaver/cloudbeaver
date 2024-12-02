/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Combobox, Container, FieldCheckbox, Loader, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import type { DataTransferOutputSettings } from '@cloudbeaver/core-sdk';

import { DefaultExportOutputSettingsResource } from './DefaultExportOutputSettingsResource.js';

interface Props {
  outputSettings: Partial<DataTransferOutputSettings>;
}

export const OutputOptionsForm = observer(function OutputOptionsForm(props: Props) {
  const translate = useTranslate();
  const resource = useResource(OutputOptionsForm, DefaultExportOutputSettingsResource, undefined);

  return (
    <Loader state={resource}>
      {() => {
        const data = resource.data;

        if (!data) {
          return null;
        }

        return (
          <Container gap parent>
            <Container wrap gap flexEnd>
              <Combobox name="encoding" state={props.outputSettings} items={data.supportedEncodings} tiny searchable>
                Encoding
              </Combobox>
              <Container vertical gap>
                <FieldCheckbox name="insertBom" state={props.outputSettings} small>
                  Insert BOM
                </FieldCheckbox>
                <FieldCheckbox name="compress" state={props.outputSettings} small>
                  {translate('data_transfer_output_settings_compress')}
                </FieldCheckbox>
              </Container>
            </Container>
          </Container>
        );
      }}
    </Loader>
  );
});
