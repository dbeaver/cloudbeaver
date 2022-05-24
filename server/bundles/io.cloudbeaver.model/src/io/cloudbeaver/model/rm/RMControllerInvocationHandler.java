package io.cloudbeaver.model.rm;

import io.cloudbeaver.model.app.WebApplication;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.model.rm.RMController;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;

public class RMControllerInvocationHandler implements InvocationHandler {
    private final WebApplication webApplication;
    private final RMController rmController;

    public RMControllerInvocationHandler(RMController rmController, WebApplication webApplication) {
        this.webApplication = webApplication;
        this.rmController = rmController;
    }

    private void checkIsRmEnabled() throws DBException {
        if (!webApplication.getAppConfiguration().isResourceManagerEnabled()) {
            throw new DBException("Resource Manager disabled");
        }
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        checkIsRmEnabled();
        return method.invoke(rmController, args);
    }
}
