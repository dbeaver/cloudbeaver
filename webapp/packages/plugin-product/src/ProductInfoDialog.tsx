/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  Button,
  ColoredContainer,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  FormFieldDescription,
  Group,
  IconOrImage,
  Link,
  s,
  TextPlaceholder,
  useResource,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { GITHUB_LINKS, WEBSITE_LINKS } from '@cloudbeaver/core-links';
import { ProductInfoResource } from '@cloudbeaver/core-root';
import { ThemeService } from '@cloudbeaver/core-theming';
import { useAppVersion } from '@cloudbeaver/core-version';

import ProductInfoDialogStyles from './ProductInfoDialog.module.css';

export const ProductInfoDialog = observer<DialogComponentProps<null>>(function ProductInfoDialog(props) {
  const translate = useTranslate();
  const productInfoResource = useResource(ProductInfoDialog, ProductInfoResource, undefined);
  const themeService = useService(ThemeService);

  const version = useAppVersion();

  const productInfo = productInfoResource.data;
  const logoIcon = themeService.themeId === 'light' ? '/icons/product-logo_light.svg' : '/icons/product-logo_dark.svg';

  const styles = useS(ProductInfoDialogStyles);

  return (
    <CommonDialogWrapper size="large">
      <CommonDialogHeader title="app_product_info" onReject={props.rejectDialog} />
      <CommonDialogBody>
        <ColoredContainer>
          <Group gap compact box>
            {!productInfo ? (
              <TextPlaceholder>{translate('app_product_info_placeholder')}</TextPlaceholder>
            ) : (
              <>
                <IconOrImage className={s(styles, { iconOrImage: true })} icon={logoIcon} />
                <FormFieldDescription className={s(styles, { formFieldDescription: true })} label={translate('app_product_info_name')}>
                  {productInfo.name}
                </FormFieldDescription>
                <FormFieldDescription className={s(styles, { formFieldDescription: true })} label={translate('app_product_info_description')}>
                  {productInfo.description}
                </FormFieldDescription>
                <FormFieldDescription className={s(styles, { formFieldDescription: true })} label="Backend version">
                  {productInfo.version}
                </FormFieldDescription>
                <FormFieldDescription className={s(styles, { formFieldDescription: true })} label="Frontend version">
                  {version.frontendVersion}
                </FormFieldDescription>
                <FormFieldDescription className={s(styles, { formFieldDescription: true })} label={translate('app_product_info_contacts')}>
                  <div className={s(styles, { contactsInfo: true })}>
                    You can contact us via our
                    <Link href={WEBSITE_LINKS.CONTACT_PAGE} target="_blank" rel="noopener noreferrer">
                      {' '}
                      Site{' '}
                    </Link>
                    or
                    <Link href={GITHUB_LINKS.CLOUDBEAVER_REPO} target="_blank" rel="noopener noreferrer">
                      {' '}
                      Github
                    </Link>
                  </div>
                </FormFieldDescription>
              </>
            )}
          </Group>
        </ColoredContainer>
      </CommonDialogBody>
      <CommonDialogFooter className={s(styles, { commonDialogFooter: true })}>
        <Button type="button" variant="secondary" onClick={props.rejectDialog}>
          {translate('ui_processing_ok')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
