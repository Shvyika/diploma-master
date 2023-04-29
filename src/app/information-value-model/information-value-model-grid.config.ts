import { ColDef } from 'ag-grid-community';

export const columnDefs: ColDef[] = [
  {
    headerName: 'Model Number',
    field: 'modelNumber',
    valueGetter: (params) => params.data.modelNumber
  },
  {
    headerName: 'Alpha',
    field: 'alpha',
    valueGetter: (params) => params.data.alpha
  },
  {
    headerName: 'Beta',
    field: 'beta',
    valueGetter: (params) => params.data.beta
  },
  {
    headerName: 'Amount of States',
    field: 'statesAmount',
    valueGetter: (params) => params.data.statesAmount
  },
  {
    headerName: 'Amount of Experiments',
    field: 'experimentsAmount',
    valueGetter: (params) => params.data.experimentsAmount
  },
  {
    headerName: 'Prior Profit',
    field: 'priorProfit',
    valueGetter: (params) => params.data.priorProfit
  },
  {
    headerName: 'Posterior Profit',
    field: 'posteriorProfit',
    valueGetter: (params) => params.data.posteriorProfit
  },
  {
    headerName: 'Information Value',
    field: 'informationValue',
    valueGetter: (params) => params.data.informationValue
  },
];

export const defaultColDef: ColDef = {
  sortable: true,
  filter: true,
  minWidth: 80
};
