import { ColDef } from 'ag-grid-community';

export const columnDefs: ColDef[] = [
  {
    headerName: 'Model Number',
    field: 'modelNumber',
    valueGetter: (params) => params.data.modelNumber
  },
  {
    headerName: 'Average User Message',
    field: 'averagePriorProfit',
    valueGetter: (params) => params.data.averageUserStatesAmount
  },
  {
    headerName: 'Average Observer Message',
    field: 'averagePriorProfit',
    valueGetter: (params) => params.data.averageObserverStatesAmount
  },
  {
    headerName: 'Average Prior Profit',
    field: 'averagePriorProfit',
    valueGetter: (params) => params.data.averagePriorProfit
  },
  {
    headerName: 'Average Posterior Profit',
    field: 'averagePosteriorProfit',
    valueGetter: (params) => params.data.averagePosteriorProfit
  },
  {
    headerName: 'Average Information Value',
    field: 'averageInformationValue',
    valueGetter: (params) => params.data.averageInformationValue
  },
];

export const defaultColDef: ColDef = {
  sortable: true,
  filter: true,
  minWidth: 100
};
