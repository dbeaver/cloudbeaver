/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { PluginOption } from 'vite';

interface IHtmlPluginOptions {
  rootUri: string;
  version: string;
  title: string;
}

export const baseHtmlPlugin = ({ rootUri, version, title }: IHtmlPluginOptions): PluginOption => {
  const indexTemplate = fs.readFileSync(fileURLToPath(import.meta.resolve('#html/index.html')), 'utf-8');
  const headTemplate = fs.readFileSync(fileURLToPath(import.meta.resolve('#html/head.html')), 'utf-8');
  const loadingScreenTemplate = fs.readFileSync(fileURLToPath(import.meta.resolve('#html/loading-screen.html')), 'utf-8');
  const ssoTemplate = fs.readFileSync(fileURLToPath(import.meta.resolve('#html/sso.html')), 'utf-8');
  const ssoErrorTemplate = fs.readFileSync(fileURLToPath(import.meta.resolve('#html/sso-error.html')), 'utf-8');

  return [
    {
      name: 'pre-html-transform',
      enforce: 'pre',
      config(config, env) {
        if (env.command === 'build') {
          rootUri = '{ROOT_URI}';
        }
        return config;
      },
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          return html
            .replaceAll('{SSO}', ssoTemplate)
            .replaceAll('{SSO_ERROR}', ssoErrorTemplate)
            .replaceAll('{INDEX}', indexTemplate)
            .replaceAll('{HEAD}', headTemplate)
            .replaceAll('{LOADING_SCREEN}', loadingScreenTemplate);
        },
      },
    },
    {
      name: 'post-html-transform',
      enforce: 'post',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          return {
            html: html
              .replaceAll('src="/', 'src="{ROOT_URI}')
              .replaceAll('href="/', 'href="{ROOT_URI}')
              .replaceAll('{ROOT_URI}', rootUri)
              .replaceAll('{VERSION}', version)
              .replaceAll('{TITLE}', title),
            tags: [
              {
                injectTo: 'body',
                tag: 'object',
                attrs: {
                  hidden: true,
                },
                children: '{STATIC_CONTENT}',
              },
            ],
          };
        },
      },
    },
  ];
};
