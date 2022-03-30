package io.cloudbeaver.service.sql;

import io.cloudbeaver.server.CBPlatform;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.data.DBDAttributeBinding;
import org.jkiss.dbeaver.model.data.DBDAttributeBindingMeta;
import org.jkiss.dbeaver.model.data.DBDDataReceiver;
import org.jkiss.dbeaver.model.data.DBDValue;
import org.jkiss.dbeaver.model.exec.*;
import org.jkiss.dbeaver.model.impl.data.DBDValueError;
import org.jkiss.dbeaver.model.runtime.VoidProgressMonitor;
import org.jkiss.dbeaver.model.struct.DBSDataContainer;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.UUID;


public class WebSQLDataLOBReceiver implements DBDDataReceiver {
    private static final Log log = Log.getLog(WebSQLDataLOBReceiver.class);
    public static final File DATA_EXPORT_FOLDER = CBPlatform.getInstance().getTempFolder(new VoidProgressMonitor(), "SQL object files");

    private final WebSQLContextInfo contextInfo;
    private final DBSDataContainer dataContainer;

    private DBDAttributeBinding[] bindings;
    private Object[] row;

    WebSQLDataLOBReceiver(WebSQLContextInfo contextInfo, DBSDataContainer dataContainer, WebDataFormat dataFormat) {
        this.contextInfo = contextInfo;
        this.dataContainer = dataContainer;
        if (!DATA_EXPORT_FOLDER.exists()){
            DATA_EXPORT_FOLDER.mkdirs();
        }
    }

    public String createBlobFile(int rowIndex) {
        String fileName = UUID.randomUUID().toString();

        File file = new File(DATA_EXPORT_FOLDER, fileName);
        try (FileOutputStream fos = new FileOutputStream(file)) {
            byte[] val = (byte[]) ((DBDValue) row[rowIndex]).getRawValue();
            fos.write(val);
        } catch (IOException e) {
            e.printStackTrace();
        }
        return fileName;
    }



    @Override
    public void fetchStart(DBCSession session, DBCResultSet resultSet, long offset, long maxRows) throws DBCException {
        DBCResultSetMetaData meta = resultSet.getMeta();
        List<DBCAttributeMetaData> attributes = meta.getAttributes();
        bindings = new DBDAttributeBindingMeta[attributes.size()];
        for (int i = 0; i < attributes.size(); i++) {
            DBCAttributeMetaData attrMeta = attributes.get(i);
            bindings[i] = new DBDAttributeBindingMeta(dataContainer, resultSet.getSession(), attrMeta);
        }
    }
    @Override
    public void fetchRow(DBCSession session, DBCResultSet resultSet) throws DBCException {

        row = new Object[bindings.length];
        for (int i = 0; i < bindings.length; i++) {
            DBDAttributeBinding binding = bindings[i];
            try {
                Object cellValue = binding.getValueHandler().fetchValueObject(
                        resultSet.getSession(),
                        resultSet,
                        binding.getMetaAttribute(),
                        i);
                row[i] = cellValue;
            } catch (Throwable e) {
                row[i] = new DBDValueError(e);
            }
        }
    }

    @Override
    public void fetchEnd(DBCSession session, DBCResultSet resultSet) throws DBCException {

    }

    @Override
    public void close() {

    }
}
