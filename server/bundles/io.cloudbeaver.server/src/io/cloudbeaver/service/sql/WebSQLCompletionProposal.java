/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
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
package io.cloudbeaver.service.sql;

import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPImage;
import org.jkiss.dbeaver.model.sql.completion.SQLCompletionProposalBase;

/**
 * Web SQL dialect.
 */
public class WebSQLCompletionProposal {

    private static final Log log = Log.getLog(WebSQLCompletionProposal.class);

    private SQLCompletionProposalBase proposal;

    public WebSQLCompletionProposal(SQLCompletionProposalBase proposal) {
        this.proposal = proposal;
    }

    public String getDisplayString() {
        return proposal.getDisplayString();
    }

    public String getType() {
        return proposal.getProposalType().name();
    }

    public String getReplacementString() {
        return proposal.getReplacementString();
    }

    public int getReplacementOffset() {
        return proposal.getReplacementOffset();
    }

    public int getReplacementLength() {
        return proposal.getReplacementLength();
    }

    public int getScore() {
        return proposal.getProposalScore();
    }

    public String getIcon() {
        DBPImage image = proposal.getObjectImage();
        return image == null ? null : image.getLocation();
    }

    public String getNodePath() {
        return null;
    }

}
