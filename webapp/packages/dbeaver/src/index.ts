/* eslint-disable import-helpers/order-imports, import/order */
/* this eslint-disable required for webpack inject */
import 'reflect-metadata';

import coreManifest, { AppBootstrap } from '@dbeaver/core';
import { App, PluginManifest } from '@dbeaver/core/di';

import { renderLayout } from './renderLayout';
import { showErrorPage } from './ErrorPage';

const PLUGINS = [] as PluginManifest[]; // will be injected by webpack

PLUGINS.unshift(coreManifest); // this is mandatory plugin

async function bootstrap() {

  const app = new App(PLUGINS);
  app.registerServices();

  const appBootstrap = app.getServiceInjector().resolveServiceByClass(AppBootstrap);

  try {
    await appBootstrap.init();
    await app.initializePlugins();
    await appBootstrap.doAfterPluginsInit();
    await app.load();

    renderLayout(app.getServiceInjector());
  } catch (e) {
    console.log(e);
    showErrorPage();
  }
}

bootstrap();
