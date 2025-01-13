package io.cloudbeaver;

import org.jkiss.junit.osgi.OSGITestRunner;
import org.jkiss.junit.osgi.annotation.RunWithProduct;
import org.jkiss.junit.osgi.annotation.RunnerProxy;
import org.junit.runner.RunWith;
import org.mockito.junit.MockitoJUnitRunner;

@RunWithProduct("CloudbeaverServerTest.product")
@RunnerProxy(MockitoJUnitRunner.class)
@RunWith(OSGITestRunner.class)
public abstract class CloudbeaverMockTest {
}
