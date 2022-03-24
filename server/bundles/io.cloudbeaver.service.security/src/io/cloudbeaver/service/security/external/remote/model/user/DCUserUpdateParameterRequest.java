package io.cloudbeaver.service.security.external.remote.model.user;

public class DCUserUpdateParameterRequest {
    private final String name;
    private final Object value;

    public DCUserUpdateParameterRequest(String name, Object value) {
        this.name = name;
        this.value = value;
    }

    public String getName() {
        return name;
    }

    public Object getValue() {
        return value;
    }
}
