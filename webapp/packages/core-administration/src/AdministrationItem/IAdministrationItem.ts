/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Style } from '@cloudbeaver/core-theming';

import { IRouteParams } from './IRouteParams';

export enum AdministrationItemType {
  Default,
  Administration,
  ConfigurationWizard
}

export interface AdministrationItemDrawerProps {
  item: IAdministrationItem;
  configurationWizard: boolean;
  onSelect: (id: string) => void;
  style: Style[];
  disabled?: boolean;
}
export type AdministrationItemDrawerComponent = React.FunctionComponent<AdministrationItemDrawerProps>;

export interface AdministrationItemContentProps {
  item: IAdministrationItem;
  configurationWizard: boolean;
  sub?: IAdministrationItemSubItem;
  param?: string | null;
}
export type AdministrationItemContentComponent = React.FunctionComponent<AdministrationItemContentProps>;

export type AdministrationItemSubContentProps = AdministrationItemContentProps & {
  sub: IAdministrationItemSubItem;
  param: string | null;
};
export type AdministrationItemSubContentComponent = React.FunctionComponent<AdministrationItemSubContentProps>;

export type AdministrationItemEvent = (configurationWizard: boolean, outside: boolean) => Promise<void> | void;
export type AdministrationItemCanActivateEvent = (
  configurationWizard: boolean,
  administration: boolean
) => Promise<boolean> | boolean;
export type AdministrationItemSubEvent = (
  param: string | null,
  configurationWizard: boolean,
  outside: boolean
) => Promise<void> | void;
export type AdministrationItemSubCanActivateEvent = (
  param: string | null,
  configurationWizard: boolean
) => Promise<boolean> | boolean;

export interface IAdministrationItemSubItem {
  name: string;
  getComponent?: () => AdministrationItemSubContentComponent;
  onActivate?: AdministrationItemSubEvent;
  onDeActivate?: AdministrationItemSubEvent;
  canActivate?: AdministrationItemSubCanActivateEvent;
}

export interface IConfigurationWizardItemOptions {
  description: string;
  order?: number;
  defaultRoute?: IRouteParams;
  isDisabled?: () => boolean;
  isHidden?: () => boolean;
  isDone?: () => boolean;
  onFinish?: () => Promise<boolean> | boolean;
  onConfigurationFinish?: () => Promise<void> | void;
}

export interface IAdministrationItemOptions {
  name: string;
  /** By default will be set to AdministrationItemType.Administration */
  type?: AdministrationItemType;
  configurationWizardOptions?: IConfigurationWizardItemOptions;
  order?: number;
  sub?: IAdministrationItemSubItem[];
  getDrawerComponent: () => AdministrationItemDrawerComponent;
  getContentComponent: () => AdministrationItemContentComponent;
  onActivate?: AdministrationItemEvent;
  onDeActivate?: AdministrationItemEvent;
  canActivate?: AdministrationItemCanActivateEvent;
}

export interface IAdministrationItem extends IAdministrationItemOptions {
  type: AdministrationItemType;
  order: number;
  sub: IAdministrationItemSubItem[];
}
