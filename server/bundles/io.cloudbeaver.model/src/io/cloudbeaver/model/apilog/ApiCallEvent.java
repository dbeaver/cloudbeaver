package io.cloudbeaver.model.apilog;

import org.jkiss.dbeaver.model.qm.meta.QMApiCallType;
import org.jkiss.dbeaver.model.qm.meta.QMMetaObjectType;

import java.time.LocalDateTime;
import java.util.Map;

public class ApiCallEvent {

    private String userName;
    private String qmSessionId;
    private QMApiCallType requestType;
    private String endpoint;
    private String httpMethod;
    private Boolean isSuccessful;
    private LocalDateTime requestTime;
    private Map<String, Object> parameters;

    public ApiCallEvent(
        String endpoint,
        String httpMethod,
        Boolean isSuccessful,
        Map<String, Object> parameters,
        String qmSessionId,
        LocalDateTime requestTime,
        QMApiCallType requestType,
        String userName
    ) {
        this.endpoint = endpoint;
        this.httpMethod = httpMethod;
        this.isSuccessful = isSuccessful;
        this.parameters = parameters;
        this.qmSessionId = qmSessionId;
        this.requestTime = requestTime;
        this.requestType = requestType;
        this.userName = userName;
    }

    public String getQmSessionId() {
        return qmSessionId;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public String getHttpMethod() {
        return httpMethod;
    }

    public Boolean isSuccessful() {
        return isSuccessful;
    }

    public LocalDateTime getRequestTime() {
        return requestTime;
    }

    public String getUserName() {
        return userName;
    }

    public static QMActivityLogInfoBuilder builder() {
        return new QMActivityLogInfoBuilder();
    }

    public QMApiCallType getRequestType() {
        return requestType;
    }

    public Map<String, Object> getParameters() {
        return parameters;
    }

    public static class QMActivityLogInfoBuilder {
        private QMMetaObjectType type;
        private String endpoint;
        private String httpMethod;
        private Boolean isSuccessful;
        private Map<String, Object> parameters;
        private String qmSessionId;
        private LocalDateTime requestTime;
        private QMApiCallType requestType;
        private String userName;

        public QMActivityLogInfoBuilder endpoint(String endpoint) {
            this.endpoint = endpoint;
            return this;
        }
        public QMActivityLogInfoBuilder httpMethod(String httpMethod) {
            this.httpMethod = httpMethod;
            return this;
        }
        public QMActivityLogInfoBuilder isSuccessful(Boolean isSuccessful) {
            this.isSuccessful = isSuccessful;
            return this;
        }
        public QMActivityLogInfoBuilder parameters(Map<String, Object> parameters) {
            this.parameters = parameters;
            return this;
        }
        public QMActivityLogInfoBuilder qmSessionId(String qmSessionId) {
            this.qmSessionId = qmSessionId;
            return this;
        }
        public QMActivityLogInfoBuilder requestTime(LocalDateTime requestTime) {
            this.requestTime = requestTime;
            return this;
        }
        public QMActivityLogInfoBuilder requestType(QMApiCallType requestType) {
            this.requestType = requestType;
            return this;
        }
        public QMActivityLogInfoBuilder userName(String userName) {
            this.userName = userName;
            return this;
        }
        public ApiCallEvent build() {
            return new ApiCallEvent(
                endpoint,
                httpMethod,
                isSuccessful,
                parameters,
                qmSessionId,
                requestTime,
                requestType,
                userName
            );
        }
    }
}
