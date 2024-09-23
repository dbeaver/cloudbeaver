/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, Link, s, usePermission, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { EAdminPermission } from '@cloudbeaver/core-root';
import { WebsiteLinks } from '@cloudbeaver/core-website';

import type { IResultSetElementKey } from '../DatabaseDataModel/Actions/ResultSet/IResultSetDataKey.js';
import { ResultSetDataContentAction } from '../DatabaseDataModel/Actions/ResultSet/ResultSetDataContentAction.js';
import type { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel.js';
import { ResultSetDataSource } from '../ResultSet/ResultSetDataSource.js';
import styles from './QuotaPlaceholder.module.css';

interface Props {
  className?: string;
  elementKey: IResultSetElementKey | undefined;
  model: IDatabaseDataModel<ResultSetDataSource>;
  resultIndex: number;
  keepSize?: boolean;
}

export const QuotaPlaceholder: React.FC<React.PropsWithChildren<Props>> = observer(function QuotaPlaceholder({
  className,
  children,
  keepSize = false,
  elementKey,
  model,
  resultIndex,
}) {
  const translate = useTranslate();
  const admin = usePermission(EAdminPermission.admin);
  const style = useS(styles);
  const contentAction = model.source.getAction(resultIndex, ResultSetDataContentAction);
  const limitInfo = elementKey ? contentAction.getLimitInfo(elementKey) : null;

  return (
    <Container className={className} keepSize={keepSize} vertical center>
      <Container center vertical>
        {translate('data_viewer_presentation_value_content_truncated_placeholder')}
        &nbsp;
        <span className={s(style, { limitWord: true })}>
          {admin ? (
            <Link title={limitInfo?.limitWithSize} href={WebsiteLinks.SERVER_CONFIGURATION_RESOURCE_QUOTAS_PAGE} target="_blank" indicator>
              {translate('ui_limit')}
            </Link>
          ) : (
            translate('ui_limit')
          )}
        </span>
      </Container>
      <Container>{children}</Container>
    </Container>
  );
});
