/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2026 DBeaver Corp and others
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
package io.cloudbeaver.test.platform.sql;

import io.cloudbeaver.service.sql.WebSQLConstants;
import io.cloudbeaver.service.sql.WebSQLContextInfo;
import io.cloudbeaver.service.sql.WebSQLProcessor;
import io.cloudbeaver.service.sql.WebSQLQueryDataContainer;
import io.cloudbeaver.service.sql.WebSQLUtils;
import io.cloudbeaver.service.sql.WebServiceBindingSQL;
import io.cloudbeaver.test.platform.CloudbeaverDBTest;
import org.jkiss.code.NotNull;
import org.jkiss.dbeaver.model.DBUtils;
import org.jkiss.dbeaver.model.exec.DBCException;
import org.jkiss.dbeaver.model.exec.DBCExecutionContext;
import org.jkiss.dbeaver.model.exec.DBCSession;
import org.jkiss.dbeaver.model.exec.DBCStatement;
import org.jkiss.dbeaver.model.sql.SQLState;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mockito;

import java.sql.SQLException;
import java.sql.SQLTimeoutException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

import static io.cloudbeaver.test.platform.util.GraphQLTestConstant.GQL_ASYNC_TASK_INFO;

public class WebSQLCancellationTest extends CloudbeaverDBTest {

    private static final String CANCEL_TASK = """
        mutation cancelTask($id: String!) {
          result: asyncTaskCancel(id: $id)
        }
        """;
    private static final String EXECUTE_RESULTS = """
        mutation executeResults($taskId: ID!) {
          result: asyncSqlExecuteResults(taskId: $taskId) {
            statusMessage
            results { title }
          }
        }
        """;

    @Test
    public void cancelledQueryPublishesResultsOnlyAfterExecutionStops() throws Exception {
        assertCancellationResult(executeFailingStatement(new SQLException("Operation cancelled", SQLState.SQL_HY008.getCode()), true));
    }

    @Test
    public void cancellingWhileWaitingForSqlParametersReturnsCancellationResult() throws Exception {
        WebSQLProcessor processor = WebServiceBindingSQL.getSQLProcessor(webConnectionInfo);
        WebSQLContextInfo context = processor.createContext(null, "PUBLIC", globalProject.getId());
        var task = WebSQLUtils.createAsyncTaskExecuteSqlQuery(
            webSession, context, "SELECT :cancel_test_param", null, null, null, false, true
        );
        String confirmationAttribute = WebSQLConstants.TASK_CONFIRMATION_ATTR_PREFIX + task.getId();
        try {
            Assertions.assertTimeoutPreemptively(Duration.ofSeconds(10), () -> {
                while (task.isRunning() && webSession.getAttribute(confirmationAttribute) == null) {
                    Thread.sleep(20);
                }
                Assertions.assertNotNull(webSession.getAttribute(confirmationAttribute), "SQL parameter confirmation did not start");
            });
            Boolean cancelled = client.sendQuery(CANCEL_TASK, Map.of("id", task.getId()));
            Assertions.assertEquals(Boolean.TRUE, cancelled);
            assertCancellationResult(clientWrapper.waitTaskFinished(task.getId()));
        } finally {
            if (task.isRunning()) {
                webSession.asyncTaskCancel(task.getId());
            }
            processor.destroyContext(context);
        }
    }

    private void assertCancellationResult(@NotNull Map<String, Object> info) throws Exception {
        Assertions.assertNull(info.get("error"));
        Map<String, Object> result = client.sendQuery(EXECUTE_RESULTS, Map.of("taskId", info.get("id")));
        Assertions.assertEquals("Canceled by the user", result.get("statusMessage"));
        Assertions.assertEquals(List.of(), result.get("results"));
    }

    @ParameterizedTest
    @MethodSource("queryFailures")
    public void genuineFailuresRemainErrors(SQLException failure, boolean cancel) throws Exception {
        Map<String, Object> info = executeFailingStatement(failure, cancel);
        Assertions.assertNotNull(info.get("error"));
    }

    private static Stream<Arguments> queryFailures() {
        return Stream.of(
            Arguments.of(new SQLException("Operation cancelled", SQLState.SQL_HY008.getCode()), false),
            Arguments.of(new SQLTimeoutException("JDBC query timeout"), true),
            Arguments.of(new SQLException("Syntax error", "42601"), true),
            Arguments.of(new SQLException("Connection failure", "08006"), true)
        );
    }

    @NotNull
    private Map<String, Object> executeFailingStatement(@NotNull SQLException failure, boolean cancel) throws Exception {
        var entered = new CountDownLatch(1);
        var resume = new CountDownLatch(1);
        DBCExecutionContext executionContext = Mockito.mock(DBCExecutionContext.class);
        DBCSession session = Mockito.mock(DBCSession.class);
        DBCStatement statement = Mockito.mock(DBCStatement.class);
        Mockito.when(executionContext.getDataSource()).thenReturn(webConnectionInfo.getDataSource());
        Mockito.when(executionContext.openSession(Mockito.any(), Mockito.any(), Mockito.anyString())).thenReturn(session);
        Mockito.when(session.getDataSource()).thenReturn(webConnectionInfo.getDataSource());
        Mockito.when(session.getExecutionContext()).thenReturn(executionContext);
        Mockito.when(session.prepareStatement(
            Mockito.any(), Mockito.anyString(), Mockito.anyBoolean(), Mockito.anyBoolean(), Mockito.anyBoolean()
        )).thenReturn(statement);
        Mockito.when(statement.executeStatement()).thenAnswer(invocation -> {
            entered.countDown();
            Assertions.assertTrue(resume.await(10, TimeUnit.SECONDS));
            throw new DBCException(failure.getMessage(), failure);
        });
        WebSQLProcessor processor = Mockito.spy(WebServiceBindingSQL.getSQLProcessor(webConnectionInfo));
        WebSQLContextInfo context = Mockito.mock(WebSQLContextInfo.class);
        Mockito.when(context.getProcessor()).thenReturn(processor);
        Mockito.doAnswer(invocation -> {
            try (var dbUtils = Mockito.mockStatic(
                DBUtils.class,
                Mockito.withSettings().mockMaker("mock-maker-inline").defaultAnswer(Mockito.CALLS_REAL_METHODS)
            )) {
                dbUtils.when(() -> DBUtils.getDefaultContext(Mockito.any(WebSQLQueryDataContainer.class), Mockito.eq(false)))
                    .thenReturn(executionContext);
                return invocation.callRealMethod();
            }
        }).when(processor).processQuery(
            Mockito.any(), Mockito.eq(context), Mockito.anyString(), Mockito.any(), Mockito.any(),
            Mockito.any(), Mockito.eq(webSession), Mockito.any(), Mockito.eq(false), Mockito.eq(false)
        );
        var task = WebSQLUtils.createAsyncTaskExecuteSqlQuery(webSession, context, "SELECT 1", null, null, null, false, false);
        try {
            Assertions.assertTrue(entered.await(10, TimeUnit.SECONDS));
            if (cancel) {
                Boolean cancelled = client.sendQuery(CANCEL_TASK, Map.of("id", task.getId()));
                Assertions.assertEquals(Boolean.TRUE, cancelled);
                Map<String, Object> info = client.sendQuery(GQL_ASYNC_TASK_INFO, Map.of("id", task.getId(), "removeOnFinish", false));
                Assertions.assertEquals(Boolean.TRUE, info.get("running"));
                Assertions.assertNull(info.get("error"));
            }
        } finally {
            resume.countDown();
        }
        return clientWrapper.waitTaskFinished(task.getId());
    }
}
