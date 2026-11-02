/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { afterAll, afterEach, describe, expect, onTestFinished, test, vi } from 'vitest';

import type { UserInfoResource } from '@cloudbeaver/core-authentication';
import { Executor, SyncExecutor } from '@cloudbeaver/core-executor';
import { LocalizationService } from '@cloudbeaver/core-localization';
import type { ServerConfigResource } from '@cloudbeaver/core-root';
import type { StorageService } from '@cloudbeaver/core-storage';
import type { AuthenticationService, AuthEventType } from '@cloudbeaver/plugin-authentication';

import { PendingLanguageBootstrap } from './PendingLanguageBootstrap.js';

// Only the login executor participates here; do not initialize the authentication UI module.
vi.mock('@cloudbeaver/plugin-authentication', () => ({ AuthenticationService: class {} }));
afterAll(() => vi.doUnmock('@cloudbeaver/plugin-authentication'));

const LANGUAGE_SETTING = 'core.localization.language';

interface Session {
  id: string;
  anonymous: boolean;
  language?: string;
}

function setup(cachedLanguage = '', login = false) {
  const localization = new LocalizationService();
  localization.setSupportedLanguages([
    { isoCode: 'en', name: 'English' },
    { isoCode: 'fr', name: 'French' },
    { isoCode: 'it', name: 'Italian' },
  ]);

  const server = { configurationMode: true, onDataUpdate: new SyncExecutor() };
  let session: Session | null = null;
  let cached = { language: cachedLanguage, login };
  const authentication = { onLogin: new Executor<AuthEventType>() };
  const user = {
    onDataUpdate: new SyncExecutor(),
    hasAccess: () => session !== null,
    isAnonymous: () => session?.anonymous === true,
    getId: () => session?.id,
    getConfigurationParameter: () => session?.language,
    updatePreferences: vi.fn(async (preferences: Record<string, string>) => {
      await Promise.resolve();

      if (!session || server.configurationMode) {
        throw new Error('Preferences are unavailable');
      }

      session.language = preferences[LANGUAGE_SETTING];
      user.onDataUpdate.execute();
    }),
  };

  const storage = {
    registerSettings: (_key: string, value: { language: string; login: boolean }) => {
      cached = value;
      cached.language = cachedLanguage;
      cached.login = login;
    },
  };

  const bootstrap = new PendingLanguageBootstrap(
    localization,
    user as unknown as UserInfoResource,
    server as unknown as ServerConfigResource,
    storage as unknown as StorageService,
    authentication as unknown as AuthenticationService,
  );

  bootstrap.register();
  onTestFinished(() => bootstrap.dispose());

  // The existing settings handler must still run normally once preferences are available.
  const saveLanguage = vi.fn((language: string) => user.updatePreferences({ [LANGUAGE_SETTING]: language }));
  localization.onChange.addHandler(saveLanguage);

  function setSession(value: Session | null) {
    session = value;
    user.onDataUpdate.execute();
  }

  return { localization, server, user, cached, bootstrap, saveLanguage, setSession, authentication };
}

afterEach(() => vi.restoreAllMocks());

describe('pending language preferences', () => {
  test('stores the selection immediately during configuration, without saving user preferences', async () => {
    const { localization, cached, user, saveLanguage } = setup();

    await localization.changeLocale('fr');

    expect(localization.currentLanguage).toBe('fr');
    expect(cached.language).toBe('fr');
    expect(user.updatePreferences).not.toHaveBeenCalled();
    expect(saveLanguage).not.toHaveBeenCalled();
  });

  test('restores an unfinished choice on reload and waits for a session', async () => {
    const { bootstrap, localization, cached, server, user } = setup('fr');
    await bootstrap.load();
    expect(localization.currentLanguage).toBe('fr');

    server.configurationMode = false;
    await bootstrap.load();
    expect(cached.language).toBe('fr');
    expect(user.updatePreferences).not.toHaveBeenCalled();
  });

  test('clears the cache after anonymous migration and transfers the latest anonymous preference on login', async () => {
    const { localization, server, setSession, user, cached, saveLanguage, authentication } = setup();
    await localization.changeLocale('fr');
    server.configurationMode = false;
    setSession({ id: 'anonymous', anonymous: true });

    await vi.waitFor(() => expect(cached.language).toBe(''));
    expect(user.updatePreferences).toHaveBeenLastCalledWith({ [LANGUAGE_SETTING]: 'fr' });

    await localization.changeLocale('it');
    expect(saveLanguage.mock.calls.map(([language]) => language)).toEqual(['it']);
    await authentication.onLogin.execute('before');
    setSession({ id: 'external-admin', anonymous: false });

    await vi.waitFor(() => expect(cached.language).toBe(''));
    expect(user.updatePreferences).toHaveBeenCalledTimes(3);
    expect(user.updatePreferences).toHaveBeenLastCalledWith({ [LANGUAGE_SETTING]: 'it' });
    expect(cached.language).toBe('');
  });

  test('preserves the login handoff across a full-page redirect', async () => {
    const beforeRedirect = setup();
    beforeRedirect.server.configurationMode = false;
    beforeRedirect.setSession({ id: 'anonymous', anonymous: true, language: 'it' });
    await beforeRedirect.authentication.onLogin.execute('before');

    const afterRedirect = setup(beforeRedirect.cached.language, beforeRedirect.cached.login);
    afterRedirect.server.configurationMode = false;
    afterRedirect.setSession({ id: 'sso-user', anonymous: false });

    await vi.waitFor(() => expect(afterRedirect.cached.language).toBe(''));
    expect(afterRedirect.user.updatePreferences).toHaveBeenCalledExactlyOnceWith({ [LANGUAGE_SETTING]: 'it' });
  });

  test('refreshes a cancelled login handoff when the anonymous preference changes', async () => {
    const { localization, server, setSession, authentication, user, cached } = setup();
    server.configurationMode = false;
    setSession({ id: 'anonymous', anonymous: true, language: 'fr' });
    await authentication.onLogin.execute('before');
    await localization.changeLocale('it');
    expect(cached.language).toBe('it');

    await authentication.onLogin.execute('before');
    setSession({ id: 'user', anonymous: false });
    await vi.waitFor(() => expect(cached.language).toBe(''));
    expect(user.updatePreferences).toHaveBeenLastCalledWith({ [LANGUAGE_SETTING]: 'it' });
  });

  test('migrates directly to an external user when anonymous access is disabled', async () => {
    const { localization, server, setSession, user, cached } = setup();
    await localization.changeLocale('fr');
    server.configurationMode = false;
    setSession({ id: 'external-user', anonymous: false });

    await vi.waitFor(() => expect(cached.language).toBe(''));
    expect(user.updatePreferences).toHaveBeenCalledExactlyOnceWith({ [LANGUAGE_SETTING]: 'fr' });
  });

  test('keeps existing profile preferences and consumes the pending choice', async () => {
    const { server, setSession, user, cached } = setup('fr');
    server.configurationMode = false;
    setSession({ id: 'existing-user', anonymous: false, language: 'it' });

    await vi.waitFor(() => expect(cached.language).toBe(''));
    expect(user.updatePreferences).not.toHaveBeenCalled();
  });

  test('does not reapply the wizard choice after the anonymous session expires', async () => {
    const { localization, server, setSession, user, cached, bootstrap } = setup('fr');
    server.configurationMode = false;
    setSession({ id: 'anonymous', anonymous: true });
    await vi.waitFor(() => expect(cached.language).toBe(''));

    await localization.changeLocale('it');
    setSession(null);
    setSession({ id: 'anonymous', anonymous: true });
    await bootstrap.load();
    expect(user.updatePreferences).toHaveBeenCalledTimes(2);

    setSession({ id: 'another-user', anonymous: false });
    await bootstrap.load();
    expect(user.updatePreferences).toHaveBeenCalledTimes(2);
  });

  test('retains a failed migration for retry and clears it only after success', async () => {
    const error = new Error('Save failed');
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { server, setSession, user, cached, bootstrap } = setup('fr');
    user.updatePreferences.mockRejectedValueOnce(error);
    server.configurationMode = false;
    setSession({ id: 'anonymous', anonymous: true });
    await vi.waitFor(() => expect(log).toHaveBeenCalledWith('Failed to save language preference', error));
    expect(cached.language).toBe('fr');

    await bootstrap.load();
    expect(cached.language).toBe('');
    expect(user.updatePreferences).toHaveBeenCalledTimes(2);
  });

  test('does not copy an authenticated user preference to the next user', async () => {
    const { server, setSession, user, bootstrap } = setup();
    server.configurationMode = false;
    setSession({ id: 'first-user', anonymous: false, language: 'fr' });
    setSession({ id: 'second-user', anonymous: false });
    await bootstrap.load();

    expect(user.updatePreferences).not.toHaveBeenCalled();
  });
});
