export interface ExperimentResult {
  modelNumber: number;
  alpha: number;
  beta: number;
  statesAmount: number;
  experimentsAmount: number;
  priorProfit: number;
  posteriorProfit: number;
  informationValue: number;
}
