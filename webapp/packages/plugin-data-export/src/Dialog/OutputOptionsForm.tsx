/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { Combobox, FieldCheckbox, InputField, Loader, useDataResource } from '@cloudbeaver/core-blocks';
import type { DataTransferOutputSettings } from '@cloudbeaver/core-sdk';

import { DefaultExportOutputSettingsResource } from './DefaultExportOutputSettingsResource';

const styles = css`
  Combobox {
    width: 140px;
  }

  row {
    display: flex;
    align-items: end;
    margin-bottom: 24px;
  }

  FieldCheckbox {
    margin-bottom: 6px;
    margin-left: 24px
  }
`;

interface Props {
  outputSettings: Partial<DataTransferOutputSettings>;
}

export const OutputOptionsForm = observer(function OutputOptionsForm(props: Props) {
  const resource = useDataResource(OutputOptionsForm, DefaultExportOutputSettingsResource, undefined);

  return (
    <Loader state={resource}>
      {() => {
        const data = resource.data;

        if (!data) {
          return null;
        }

        return styled(styles)(
          <>
            <row>
              <Combobox
                name="encoding"
                state={props.outputSettings}
                items={data.supportedEncodings}
                searchable
              >
                Encoding
              </Combobox>
              <FieldCheckbox
                name="insertBom"
                state={props.outputSettings}
              >
                Insert BOM
              </FieldCheckbox>
            </row>
            <InputField
              name="timestampPattern"
              state={props.outputSettings}
              small
            >
              Filename timestamp pattern
            </InputField>
          </>
        );
      }}
    </Loader>
  );
});