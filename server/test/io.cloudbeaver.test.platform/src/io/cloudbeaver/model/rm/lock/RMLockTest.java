/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2023 DBeaver Corp and others
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

import io.cloudbeaver.test.platform.CEServerTestSuite;
import org.jkiss.dbeaver.Log;
import org.junit.Assert;
import org.junit.Test;
import org.mockito.Mockito;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

public class RMLockTest {
    private static final Log log = Log.getLog(RMLockTest.class);
    private final String project1 = "s_fakeProject1";
    private final String project2 = "s_fakeProject2";


    @Test
    public void testProjectAccessUsingSeveralControllers() throws Throwable {
        var lockController1 = new TestLockController(CEServerTestSuite.getTestApp(), 1);

        CountDownLatch thread1CDL = new CountDownLatch(1);
        CountDownLatch thread2CDL = new CountDownLatch(1);
        CountDownLatch globalCountDown = new CountDownLatch(2);

        AtomicBoolean isLockedByThread1 = new AtomicBoolean(false);
        AtomicReference<Throwable> exceptionReference = new AtomicReference<>();
        var thread1 = new Thread(() -> {
            try (var lock = lockController1.lockProject(project1, "testThatProjectLocked1")) {
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
        });
        thread1.start();

        int atLeastWaitCalls = 1;
        var lockController2 = Mockito.spy(new TestLockController(CEServerTestSuite.getTestApp(), 100));
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
        }).when(lockController2).awaitingUnlock(Mockito.any(), Mockito.any());
        var thread2 = new Thread(() -> {
            try {
                thread2CDL.await(1, TimeUnit.MINUTES);
                Assert.assertTrue("Thread 1 not running", isLockedByThread1.get());
                Assert.assertTrue("Project not locked", lockController2.isProjectLocked(project1));
                try (var lock = lockController2.lockProject(project1, "testThatProjectLocked2")) {
                    Assert.assertFalse("Project locked by thread1, but thread2 has access to project", isLockedByThread1.get());
                    //that we were really waiting for the file and the lock was not removed earlier
                    Mockito.verify(lockController2, Mockito.atLeast(atLeastWaitCalls)).awaitingUnlock(Mockito.any(), Mockito.any());
                }
            } catch (Throwable e) {
                log.error(e);
                exceptionReference.set(e);
            } finally {
                globalCountDown.countDown();
            }
        });
        thread2.start();
        globalCountDown.await(1, TimeUnit.MINUTES);
        if (exceptionReference.get() != null) {
            throw exceptionReference.get();
        }
    }

    @Test
    public void testAccessToDifferentProjects() throws Throwable {
        var lockController1 = new TestLockController(CEServerTestSuite.getTestApp(), 1);

        CountDownLatch thread1CDL = new CountDownLatch(1);
        CountDownLatch thread2CDL = new CountDownLatch(1);
        CountDownLatch globalCountDown = new CountDownLatch(2);

        AtomicBoolean isLockedByThread1 = new AtomicBoolean(false);
        AtomicBoolean isLockedByThread2 = new AtomicBoolean(false);
        AtomicReference<Throwable> exceptionReference = new AtomicReference<>();
        var thread1 = new Thread(() -> {
            try (var lock = lockController1.lockProject(project1, "testAccessToDifferentProjects1")) {
                isLockedByThread1.set(true);
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
        });
        thread1.start();

        var lockController2 = new TestLockController(CEServerTestSuite.getTestApp(), 1);
        var thread2 = new Thread(() -> {
            try {
                try (var lock = lockController2.lockProject(project2, "testAccessToDifferentProjects2")) {
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
        });
        thread2.start();
        globalCountDown.await(1, TimeUnit.MINUTES);
        if (exceptionReference.get() != null) {
            throw exceptionReference.get();
        }

        Assert.assertFalse(lockController2.isProjectLocked(project1));
        Assert.assertFalse(lockController2.isProjectLocked(project2));
    }

}
