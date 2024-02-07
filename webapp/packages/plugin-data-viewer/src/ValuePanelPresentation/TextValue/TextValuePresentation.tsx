/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import styled, { css } from 'reshadow';

import { ActionIconButton, Button, Container, Fill, Group, useStyles, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { BASE_TAB_STYLES, TabContainerPanelComponent, TabList, TabsState, UNDERLINE_TAB_STYLES, useTabLocalState } from '@cloudbeaver/core-ui';
import { bytesToSize, isNotNullDefined } from '@cloudbeaver/core-utils';
import { EditorLoader, useCodemirrorExtensions } from '@cloudbeaver/plugin-codemirror6';

import { isResultSetContentValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetContentValue';
import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import { useResultSetActions } from '../../DatabaseDataModel/Actions/ResultSet/useResultSetActions';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import type { IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService';
import { QuotaPlaceholder } from '../QuotaPlaceholder';
import { VALUE_PANEL_TOOLS_STYLES } from '../ValuePanelTools/VALUE_PANEL_TOOLS_STYLES';
import { getDefaultLineWrapping } from './getDefaultLineWrapping';
import { getTypeExtension } from './getTypeExtension';
import { TextValuePresentationService } from './TextValuePresentationService';
import { useTextValue } from './useTextValue';

const styles = css`
  Tab {
    composes: theme-ripple theme-background-surface theme-text-text-primary-on-light from global;
  }
  TabList {
    composes: theme-border-color-background theme-background-background from global;
    overflow: auto;
    border-radius: var(--theme-group-element-radius);

    & Tab {
      border-bottom: 0;

      &:global([aria-selected='false']) {
        border-bottom: 0 !important;
      }
    }
  }
`;

const DEFAULT_CONTENT_TYPE = 'text/plain';

export const TextValuePresentation: TabContainerPanelComponent<IDataValuePanelProps<any, IDatabaseResultSet>> = observer(
  function TextValuePresentation({ model, resultIndex, dataFormat }) {
    const translate = useTranslate();
    const notificationService = useService(NotificationService);
    const textValuePresentationService = useService(TextValuePresentationService);
    const style = useStyles(styles, UNDERLINE_TAB_STYLES, VALUE_PANEL_TOOLS_STYLES);
    const selection = model.source.getAction(resultIndex, ResultSetSelectAction);
    const activeElements = selection.getActiveElements();
    const firstSelectedCell = activeElements.length ? activeElements[0] : undefined;
    const activeTabs = textValuePresentationService.tabs.getDisplayed({
      dataFormat: dataFormat,
      model: model,
      resultIndex: resultIndex,
    });
    const { contentAction, editAction, formatAction } = useResultSetActions({
      model,
      resultIndex,
    });
    const contentValue = firstSelectedCell ? formatAction.get(firstSelectedCell) : null;
    const state = useTabLocalState(() =>
      observable({
        lineWrapping: null as boolean | null,
        currentContentType: null as string | null,

        setContentType(contentType: string | null) {
          this.currentContentType = contentType;
        },
        setLineWrapping(lineWrapping: boolean | null) {
          this.lineWrapping = lineWrapping;
        },
      }),
    );

    let contentType = state.currentContentType;
    let autoContentType = DEFAULT_CONTENT_TYPE;

    if (isResultSetContentValue(contentValue)) {
      if (contentValue.contentType) {
        switch (contentValue.contentType) {
          case 'text/json':
            autoContentType = 'application/json';
            break;
          case 'application/octet-stream':
            autoContentType = 'application/octet-stream;type=base64';
            break;
          default:
            autoContentType = contentValue.contentType;
            break;
        }
      }
    }

    if (contentType === null) {
      contentType = autoContentType ?? DEFAULT_CONTENT_TYPE;
    }

    if (activeTabs.length > 0 && !activeTabs.some(tab => tab.key === contentType)) {
      contentType = activeTabs[0].key;
    }

    const autoLineWrapping = getDefaultLineWrapping(contentType);
    const lineWrapping = state.lineWrapping ?? autoLineWrapping;

    const textValueData = useTextValue({
      model,
      resultIndex,
      currentContentType: contentType,
      elementKey: firstSelectedCell,
    });
    const isSelectedCellReadonly = firstSelectedCell && (formatAction.isReadOnly(firstSelectedCell) || formatAction.isBinary(firstSelectedCell));
    const isReadonlyByResultIndex = model.isReadonly(resultIndex) || model.isDisabled(resultIndex) || !firstSelectedCell;
    const isReadonly = isSelectedCellReadonly || isReadonlyByResultIndex;
    const valueSize =
      isResultSetContentValue(contentValue) && isNotNullDefined(contentValue.contentLength) ? bytesToSize(contentValue.contentLength) : undefined;
    const canSave = firstSelectedCell && contentAction.isDownloadable(firstSelectedCell);
    const shouldShowPasteButton = textValueData.isTextColumn && textValueData.isTruncated;
    const typeExtension = useMemo(() => getTypeExtension(contentType!) ?? [], [contentType]);
    const extensions = useCodemirrorExtensions(undefined, typeExtension);

    function valueChangeHandler(newValue: string) {
      if (firstSelectedCell && !isReadonly) {
        editAction.set(firstSelectedCell, newValue);
      }
    }

    async function saveHandler() {
      if (!firstSelectedCell) {
        return;
      }

      try {
        await contentAction.downloadFileData(firstSelectedCell);
      } catch (exception) {
        notificationService.logException(exception as any, 'data_viewer_presentation_value_content_download_error');
      }
    }

    async function selectTabHandler(tabId: string) {
      // currentContentType may be selected automatically we don't want to change state in this case
      if (tabId !== contentType) {
        state.setContentType(tabId);
      }
    }

    function toggleLineWrappingHandler() {
      state.setLineWrapping(!lineWrapping);
    }

    return styled(style)(
      <Container vertical gap dense overflow>
        <Container keepSize center overflow>
          <Container keepSize>
            <TabsState
              dataFormat={dataFormat}
              resultIndex={resultIndex}
              container={textValuePresentationService.tabs}
              currentTabId={contentType}
              model={model}
              lazy
              onChange={tab => selectTabHandler(tab.tabId)}
            >
              <TabList style={[BASE_TAB_STYLES, styles, UNDERLINE_TAB_STYLES]} />
            </TabsState>
          </Container>
        </Container>
        <Group maximum box>
          <EditorLoader
            key={isReadonly ? '1' : '0'}
            value={textValueData.textValue}
            lineWrapping={lineWrapping}
            readonly={isReadonly}
            extensions={extensions}
            onChange={valueChangeHandler}
          />
        </Group>
        {textValueData.isTruncated && (
          <Container keepSize>
            <QuotaPlaceholder model={model} resultIndex={resultIndex} elementKey={firstSelectedCell}>
              {shouldShowPasteButton && (
                <Container keepSize>
                  <Button disabled={model.isLoading()} onClick={textValueData.pasteFullText}>
                    {`${translate('ui_show_more')} (${valueSize})`}
                  </Button>
                </Container>
              )}
            </QuotaPlaceholder>
          </Container>
        )}
        <Container keepSize center overflow>
          {canSave && (
            <ActionIconButton title={translate('ui_download')} name="/icons/export.svg" disabled={model.isLoading()} img onClick={saveHandler} />
          )}
          <ActionIconButton
            title={translate(
              lineWrapping ? 'data_viewer_presentation_value_text_line_wrapping_no_wrap' : 'data_viewer_presentation_value_text_line_wrapping_wrap',
            )}
            name={lineWrapping ? 'img-original-size' : 'img-fit-size'}
            onClick={toggleLineWrappingHandler}
          />
          <Fill />
        </Container>
      </Container>,
    );
  },
);
