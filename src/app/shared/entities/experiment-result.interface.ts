export interface ExperimentResult {
  modelNumber: number;
  alpha: number;
  beta: number;
  statesAmount: number;
  guessingAmount: number;
  priorAverageProfit: number;
  posteriorAverageProfit: number;
  informationValue: number;
}
