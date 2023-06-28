/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { BASE_CONTAINERS_STYLES, Combobox, Container, FieldCheckbox, Loader, useResource } from '@cloudbeaver/core-blocks';
import type { DataTransferOutputSettings } from '@cloudbeaver/core-sdk';

import { DefaultExportOutputSettingsResource } from './DefaultExportOutputSettingsResource';

const styles = css`
  Combobox {
    width: 140px;
  }
`;

interface Props {
  outputSettings: Partial<DataTransferOutputSettings>;
}

export const OutputOptionsForm = observer(function OutputOptionsForm(props: Props) {
  const resource = useResource(OutputOptionsForm, DefaultExportOutputSettingsResource, undefined);

  return (
    <Loader state={resource}>
      {() => {
        const data = resource.data;

        if (!data) {
          return null;
        }

        return styled(
          styles,
          BASE_CONTAINERS_STYLES,
        )(
          <Container gap parent>
            <Container wrap gap flexEnd>
              <Combobox name="encoding" state={props.outputSettings} items={data.supportedEncodings} tiny searchable>
                Encoding
              </Combobox>
              <FieldCheckbox name="insertBom" state={props.outputSettings} small>
                Insert BOM
              </FieldCheckbox>
            </Container>
          </Container>,
        );
      }}
    </Loader>
  );
});
