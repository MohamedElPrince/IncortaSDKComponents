import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { ConfirmType } from './utils/types';

interface ConfirmDialogArgs {
    selectedRows: any[];
    cols: any[];
    visible: boolean;
    typeInfo: [ConfirmType, String | undefined];
    onConfirm: (confirm: boolean) => void;
}

const ConfirmDialog = ({ selectedRows, cols, visible, typeInfo: [type, action], onConfirm }: ConfirmDialogArgs) => {

    const tableColumns = cols.map((col) => {
        return (
            <Column
                key={col.field}
                field={col.field}
                header={col.header}
                style={{ width: '15%', textAlign: 'left' }}
            />
        );
    });

    const tableFooter = () => {
        return (<div>
            {(type !== ConfirmType.PreventAction) && <Button label="Cancel" icon="pi pi-times" className="p-button-text" style={{ boxShadow: 'none' }} onClick={() => onConfirm(false)} />}
            <Button label="OK" icon="pi pi-check" autoFocus style={{ boxShadow: 'none' }} onClick={() => onConfirm(type !== ConfirmType.PreventAction)} />
        </div>)
    };

    let dataTable = () => (type === ConfirmType.ChangeData && <DataTable value={selectedRows} showGridlines stripedRows paginator rows={3}>
        {tableColumns}
    </DataTable>);

    const width = type === ConfirmType.ChangeData ? 75 : 30;
    const dialogBody = () => {
        let message: String | undefined;
        switch (type) {
            case ConfirmType.DirectAction:
                message = `Are you sure you want to ${action}?`
                break;
            case ConfirmType.PreventAction:
                message = 'There is a validation error, please solve it before submitting!';
                break;
        }
        return message && <p className="m-0">{message}</p>
    }
    return (
        <Dialog resizable={true} header={dataTable} visible={visible} style={{ position: 'fixed', top: '0px', minWidth: `${width}vw` }}
            modal={false} closable={false} contentStyle={{ maxHeight: '350px' }} footer={tableFooter} onHide={() => { }}>
            {dialogBody()}
        </Dialog>
    )
}

export default ConfirmDialog;  
