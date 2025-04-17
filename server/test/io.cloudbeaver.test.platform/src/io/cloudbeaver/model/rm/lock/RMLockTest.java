/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.cloudbeaver.model.rm.lock;

import io.cloudbeaver.app.CEAppStarter;
import org.jkiss.dbeaver.Log;
import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.Test;
import org.mockito.Mockito;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

public class RMLockTest {
    private static final Log log = Log.getLog(RMLockTest.class);
    private final String project1 = "s_fakeProject1";
    private final String project2 = "s_fakeProject2";
    private static final ExecutorService executor = Executors.newFixedThreadPool(2);

    @AfterClass
    public static void shutdown() {
        executor.shutdown();
    }

    @Test
    public void testProjectAccessUsingSeveralControllers() throws Throwable {
        var lockController1 = new TestLockController(CEAppStarter.getTestApp(), 1);

        CountDownLatch thread1CDL = new CountDownLatch(1);
        CountDownLatch thread2CDL = new CountDownLatch(1);
        CountDownLatch globalCountDown = new CountDownLatch(2);

        AtomicBoolean isLockedByThread1 = new AtomicBoolean(false);
        AtomicReference<Throwable> exceptionReference = new AtomicReference<>();

        Runnable runnable1 = () -> {
            try (var lock = lockController1.lock(project1, "testThatProjectLocked1")) {
                isLockedByThread1.set(true);
                thread2CDL.countDown();
                thread1CDL.await(1, TimeUnit.MINUTES);
            } catch (Throwable e) {
                log.error(e);
                exceptionReference.set(e);
            } finally {
                isLockedByThread1.set(false);
                globalCountDown.countDown();
            }
        };

        int atLeastWaitCalls = 1;
        var lockController2 = Mockito.spy(new TestLockController(CEAppStarter.getTestApp(), 1000));
        Mockito.doAnswer(new Answer() {
            private int count = 0;

            @Override
            public Object answer(InvocationOnMock invocationOnMock) throws Throwable {
                count++;
                if (count == atLeastWaitCalls) {
                    //unlock thread1
                    thread1CDL.countDown();
                }
                return invocationOnMock.callRealMethod();
            }
        }).when(lockController2).awaitingUnlock(Mockito.any());
        Runnable runnable2 = () -> {
            try {
                thread2CDL.await(1, TimeUnit.MINUTES);
                Assert.assertTrue("Project not locket by thread 1", isLockedByThread1.get());
                Assert.assertTrue("Project not locked", lockController2.isFileLocked(project1));
                try (var lock = lockController2.lock(project1, "testThatProjectLocked2")) {
                    //that we were really waiting for the file and the lock was not removed earlier
                    Mockito.verify(lockController2, Mockito.atLeast(atLeastWaitCalls)).awaitingUnlock(Mockito.any());
                }
            } catch (Throwable e) {
                log.error(e);
                exceptionReference.set(e);
            } finally {
                globalCountDown.countDown();
            }
        };

        executor.submit(runnable1);
        executor.submit(runnable2);
        globalCountDown.await(1, TimeUnit.MINUTES);
        if (exceptionReference.get() != null) {
            throw exceptionReference.get();
        }
        Assert.assertFalse(lockController2.isFileLocked(project1));
    }

    @Test
    public void testAccessToDifferentProjects() throws Throwable {
        var lockController1 = new TestLockController(CEAppStarter.getTestApp(), 1);

        CountDownLatch thread1CDL = new CountDownLatch(1);
        CountDownLatch thread2CDL = new CountDownLatch(1);
        CountDownLatch thread2InitCDL = new CountDownLatch(1);
        CountDownLatch globalCountDown = new CountDownLatch(2);

        AtomicBoolean isLockedByThread1 = new AtomicBoolean(false);
        AtomicBoolean isLockedByThread2 = new AtomicBoolean(false);
        AtomicReference<Throwable> exceptionReference = new AtomicReference<>();
        Runnable runnable1 = () -> {
            try (var lock = lockController1.lock(project1, "testAccessToDifferentProjects1")) {
                isLockedByThread1.set(true);
                thread2InitCDL.countDown();
                thread1CDL.await(1, TimeUnit.MINUTES);
                Assert.assertTrue("Project2 not locked by thread2", isLockedByThread2.get());
                thread2CDL.countDown();
            } catch (Throwable e) {
                log.error(e);
                exceptionReference.set(e);
            } finally {
                isLockedByThread1.set(false);
                globalCountDown.countDown();
            }
        };

        var lockController2 = new TestLockController(CEAppStarter.getTestApp(), 1);
        Runnable runnable2 = () -> {
            try {
                try (var lock = lockController2.lock(project2, "testAccessToDifferentProjects2")) {
                    thread2InitCDL.await();
                    Assert.assertTrue("Project1 not locket by thread1", isLockedByThread1.get());
                    isLockedByThread2.set(true);
                    thread1CDL.countDown();
                    thread2CDL.await();
                }
            } catch (Throwable e) {
                log.error(e);
                exceptionReference.set(e);
            } finally {
                isLockedByThread2.set(false);
                globalCountDown.countDown();
            }
        };

        executor.submit(runnable1);
        executor.submit(runnable2);
        globalCountDown.await(1, TimeUnit.MINUTES);
        if (exceptionReference.get() != null) {
            throw exceptionReference.get();
        }

        Assert.assertFalse(lockController2.isFileLocked(project1));
        Assert.assertFalse(lockController2.isFileLocked(project2));
    }

    @Test
    public void testForceUnlock() throws Throwable {
        var lockController1 = new TestLockController(CEAppStarter.getTestApp(), 1);

        CountDownLatch thread1CDL = new CountDownLatch(1);
        CountDownLatch globalCountDown = new CountDownLatch(2);

        AtomicBoolean isLockedByThread1 = new AtomicBoolean(false);
        AtomicReference<Throwable> exceptionReference = new AtomicReference<>();
        Runnable runnable1 = () -> {
            try (var lock = lockController1.lock(project1, "testForceUnlock1")) {
                isLockedByThread1.set(true);
                thread1CDL.await(1, TimeUnit.MINUTES);
            } catch (Throwable e) {
                log.error(e);
                exceptionReference.set(e);
            } finally {
                isLockedByThread1.set(false);
                globalCountDown.countDown();
            }
        };

        var lockController2 = Mockito.spy(new TestLockController(CEAppStarter.getTestApp(), 100));
        Runnable runnable2 = () -> {
            try {
                try (var lock = lockController2.lock(project1, "testForceUnlock2")) {
                    Assert.assertTrue("Project1 not locket by thread1", isLockedByThread1.get());
                    Mockito.verify(lockController2, Mockito.atLeast(5)).isLocked(Mockito.any());
                    thread1CDL.countDown();
                }
            } catch (Throwable e) {
                log.error(e);
                exceptionReference.set(e);
            } finally {
                globalCountDown.countDown();
            }
        };

        executor.submit(runnable1);
        executor.submit(runnable2);
        globalCountDown.await(1, TimeUnit.MINUTES);
        if (exceptionReference.get() != null) {
            throw exceptionReference.get();
        }
        Assert.assertFalse(lockController2.isFileLocked(project1));
    }
}
