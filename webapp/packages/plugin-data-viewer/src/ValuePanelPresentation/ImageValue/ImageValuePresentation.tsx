/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';

import { ActionIconButton, Button, Container, Fill, Loader, s, useS, useSuspense, useTranslate } from '@cloudbeaver/core-blocks';
import { type TabContainerPanelComponent, useTabLocalState } from '@cloudbeaver/core-ui';
import { blobToBase64, bytesToSize, throttle } from '@cloudbeaver/core-utils';

import { isResultSetContentValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetContentValue';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import type { IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService';
import { QuotaPlaceholder } from '../QuotaPlaceholder';
import styles from './ImageValuePresentation.module.css';
import { useValuePanelImageValue } from './useValuePanelImageValue';

export const ImageValuePresentation: TabContainerPanelComponent<IDataValuePanelProps<any, IDatabaseResultSet>> = observer(
  function ImageValuePresentation({ model, resultIndex }) {
    const translate = useTranslate();
    const suspense = useSuspense();
    const style = useS(styles);
    const state = useTabLocalState(() =>
      observable(
        {
          stretch: false,
          toggleStretch() {
            this.stretch = !this.stretch;
          },
        },
        {
          stretch: observable.ref,
          toggleStretch: action.bound,
        },
      ),
    );
    const data = useValuePanelImageValue({ model, resultIndex });
    const loading = model.isLoading();
    const valueSize = bytesToSize(isResultSetContentValue(data.cellValue) ? data.cellValue.contentLength ?? 0 : 0);
    const isTruncatedMessageDisplay = !!data.truncated && !data.src;
    const isDownloadable = isTruncatedMessageDisplay && !!data.selectedCell && data.contentAction.isDownloadable(data.selectedCell);
    const isCacheDownloading = isDownloadable && data.contentAction.isLoading(data.selectedCell);
    const debouncedDownload = useMemo(() => throttle(() => data.download(), 1000, false), []);
    const srcGetter = suspense.observedValue(
      'src',
      () => data.src,
      async src => {
        if (src instanceof Blob) {
          return await blobToBase64(src);
        }
        return src;
      },
    );

    return (
      <Container vertical>
        <Container fill overflow center>
          <Loader suspense>
            {data.src && <ImageRenderer srcGetter={srcGetter} className={s(style, { img: true, stretch: state.stretch })} />}
            {isTruncatedMessageDisplay && (
              <QuotaPlaceholder model={data.model} resultIndex={data.resultIndex} elementKey={data.selectedCell}>
                {isDownloadable && (
                  <Button disabled={loading} loading={isCacheDownloading} loader onClick={data.loadFullImage}>
                    {`${translate('ui_view')} (${valueSize})`}
                  </Button>
                )}
              </QuotaPlaceholder>
            )}
          </Loader>
        </Container>
        <Container gap dense keepSize>
          <Container keepSize flexStart noWrap>
            {data.canSave && (
              <ActionIconButton title={translate('ui_download')} name="/icons/export.svg" disabled={loading} img onClick={debouncedDownload} />
            )}
            {data.canUpload && (
              <ActionIconButton title={translate('ui_upload')} name="/icons/import.svg" disabled={loading} img onClick={data.upload} />
            )}
          </Container>
          <Fill />
          <Container keepSize flexEnd>
            <ActionIconButton
              title={translate(state.stretch ? 'data_viewer_presentation_value_image_original_size' : 'data_viewer_presentation_value_image_fit')}
              name={state.stretch ? 'img-original-size' : 'img-fit-size'}
              onClick={state.toggleStretch}
            />
          </Container>
        </Container>
      </Container>
    );
  },
);

interface ImageRendererProps {
  className?: string;
  srcGetter: () => string | null;
}

export const ImageRenderer = observer<ImageRendererProps>(function ImageRenderer({ srcGetter, className }) {
  const src = srcGetter();

  if (!src) {
    return null;
  }

  return <img src={src} className={className} />;
});
