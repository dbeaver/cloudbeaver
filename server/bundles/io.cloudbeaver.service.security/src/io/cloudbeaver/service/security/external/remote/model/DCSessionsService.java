package io.cloudbeaver.service.security.external.remote.model;

import io.cloudbeaver.service.security.external.remote.model.session.DCSessionCreateRequest;
import io.cloudbeaver.service.security.external.remote.model.session.DCSessionUpdateRequest;
import org.jkiss.dbeaver.DBException;

public interface DCSessionsService {
    void createSession(DCSessionCreateRequest request) throws DBException;

    void updateSession(String sessionId, DCSessionUpdateRequest request) throws DBException;

    boolean isSessionPersisted(String sessionId) throws DBException;
}
