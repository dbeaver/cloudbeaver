import 'reflect-metadata';

import { bootstrap } from '@cloudbeaver/core-bootstrap';
import type { PluginManifest } from '@cloudbeaver/core-di';
import administration from '@cloudbeaver/plugin-administration';
import authentication from '@cloudbeaver/plugin-authentication';
import authenticationAdministration from '@cloudbeaver/plugin-authentication-administration';
import connectionCustom from '@cloudbeaver/plugin-connection-custom';
import connectionSearch from '@cloudbeaver/plugin-connection-search';
import connectionTemplate from '@cloudbeaver/plugin-connection-template';
import connectionPlugin from '@cloudbeaver/plugin-connections';
import connectionAdministration from '@cloudbeaver/plugin-connections-administration';
import dataExport from '@cloudbeaver/plugin-data-export';
import spreadsheetNew from '@cloudbeaver/plugin-data-spreadsheet-new';
import dataViewer from '@cloudbeaver/plugin-data-viewer';
import datasourceContextSwitch from '@cloudbeaver/plugin-datasource-context-switch';
import ddlViewer from '@cloudbeaver/plugin-ddl-viewer';
import gisViewer from '@cloudbeaver/plugin-gis-viewer';
import help from '@cloudbeaver/plugin-help';
import localization from '@cloudbeaver/plugin-localization';
import logViewer from '@cloudbeaver/plugin-log-viewer';
import navigationTabs from '@cloudbeaver/plugin-navigation-tabs';
import navigationTree from '@cloudbeaver/plugin-navigation-tree';
import objectViewer from '@cloudbeaver/plugin-object-viewer';
import productPlugin from '@cloudbeaver/plugin-product';
import resourceManager from '@cloudbeaver/plugin-resource-manager';
import resourceManagerAdministration from '@cloudbeaver/plugin-resource-manager-administration';
import root from '@cloudbeaver/plugin-root';
import settingsMenu from '@cloudbeaver/plugin-settings-menu';
import settingsMenuAdministration from '@cloudbeaver/plugin-settings-menu-administration';
import sqlEditor from '@cloudbeaver/plugin-sql-editor';
import sqlEditorTab from '@cloudbeaver/plugin-sql-editor-navigation-tab';
import sqlEditorResource from '@cloudbeaver/plugin-sql-editor-navigation-tab-resource';
import sqlEditorScreen from '@cloudbeaver/plugin-sql-editor-screen';
import theme from '@cloudbeaver/plugin-theme';
import toolsPanel from '@cloudbeaver/plugin-tools-panel';
import topAppBar from '@cloudbeaver/plugin-top-app-bar';
import userProfile from '@cloudbeaver/plugin-user-profile';
import userProfileAdministration from '@cloudbeaver/plugin-user-profile-administration';
import version from '@cloudbeaver/plugin-version';
import versionUpdate from '@cloudbeaver/plugin-version-update-administration';


import { defaultProductManifest } from './manifest';

const PLUGINS: PluginManifest[] = [
  administration,
  spreadsheetNew,
  authentication,
  authenticationAdministration,
  theme,
  localization,
  connectionCustom,
  connectionTemplate,
  connectionSearch,
  dataExport,
  dataViewer,
  gisViewer,
  ddlViewer,
  objectViewer,
  sqlEditor,
  sqlEditorTab,
  sqlEditorScreen,
  userProfile,
  userProfileAdministration,
  defaultProductManifest,
  connectionPlugin,
  connectionAdministration,
  versionUpdate,
  productPlugin,
  settingsMenu,
  settingsMenuAdministration,
  help,
  resourceManager,
  resourceManagerAdministration,
  sqlEditorResource,
  logViewer,
  navigationTree,
  datasourceContextSwitch,
  topAppBar,
  version,
  navigationTabs,
  root,
  toolsPanel,
];

bootstrap(PLUGINS);
