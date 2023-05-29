/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import {
  BASE_CONTAINERS_STYLES,
  Button,
  ColoredContainer,
  FormFieldDescription,
  Group,
  IconOrImage,
  Link,
  TextPlaceholder,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogBody, CommonDialogFooter, CommonDialogHeader, CommonDialogWrapper, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { ThemeService } from '@cloudbeaver/core-theming';
import { useAppVersion } from '@cloudbeaver/plugin-version';

const productInfoDialogStyles = css`
  contacts-info {
    display: flex;
    white-space: pre-wrap;
  }
  FormFieldDescription {
    white-space: pre-wrap;
  }
  IconOrImage {
    max-width: 154px;
    height: 32px;
  }
  CommonDialogFooter {
    align-items: center;
    justify-content: flex-end;
  }
`;

export const ProductInfoDialog = observer<DialogComponentProps<null>>(function ProductInfoDialog(props) {
  const translate = useTranslate();
  const serverConfigResource = useService(ServerConfigResource);
  const themeService = useService(ThemeService);

  const version = useAppVersion();

  const productInfo = serverConfigResource.data?.productInfo;
  const logoIcon = themeService.currentThemeId === 'light' ? '/icons/product-logo_light.svg' : '/icons/product-logo_dark.svg';

  return styled(
    BASE_CONTAINERS_STYLES,
    productInfoDialogStyles,
  )(
    <CommonDialogWrapper size="large">
      <CommonDialogHeader title="app_product_info" onReject={props.rejectDialog} />
      <CommonDialogBody>
        <ColoredContainer>
          <Group gap compact box>
            {!productInfo ? (
              <TextPlaceholder>{translate('app_product_info_placeholder')}</TextPlaceholder>
            ) : (
              <>
                <IconOrImage icon={logoIcon} />
                <FormFieldDescription label={translate('app_product_info_name')}>{productInfo.name}</FormFieldDescription>
                <FormFieldDescription label={translate('app_product_info_description')}>{productInfo.description}</FormFieldDescription>
                {productInfo.licenseInfo && (
                  <FormFieldDescription label={translate('app_product_info_license_info')}>{productInfo.licenseInfo}</FormFieldDescription>
                )}
                <FormFieldDescription label={translate('app_product_info_build_time')}>{productInfo.buildTime}</FormFieldDescription>
                <FormFieldDescription label="Backend version">{productInfo.version}</FormFieldDescription>
                <FormFieldDescription label="Frontend version">{version.frontendVersion}</FormFieldDescription>
                <FormFieldDescription label={translate('app_product_info_contacts')}>
                  <contacts-info>
                    You can contact us via our
                    <Link href="https://cloudbeaver.io/contact/" target="_blank" rel="noopener noreferrer">
                      {' '}
                      Site{' '}
                    </Link>
                    or
                    <Link href="https://github.com/dbeaver/cloudbeaver" target="_blank" rel="noopener noreferrer">
                      {' '}
                      Github
                    </Link>
                  </contacts-info>
                </FormFieldDescription>
              </>
            )}
          </Group>
        </ColoredContainer>
      </CommonDialogBody>
      <CommonDialogFooter>
        <Button type="button" mod={['outlined']} onClick={props.rejectDialog}>
          {translate('ui_processing_ok')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>,
  );
});
