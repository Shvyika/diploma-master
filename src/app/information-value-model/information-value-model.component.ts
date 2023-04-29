import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { Subject, takeUntil } from 'rxjs';

import { State } from '../shared/entities/condition.interface';
import { ExperimentResult } from '../shared/entities/experiment-result.interface';

import { columnDefs, defaultColDef } from './information-value-model-grid.config';

@Component({
  selector: 'app-information-value-model',
  templateUrl: './information-value-model.component.html',
  styleUrls: ['./information-value-model.component.scss']
})
export class InformationValueModelComponent implements OnInit, OnDestroy {
  public informationValueModelForm: FormGroup = new FormGroup({});

  private gridApi: GridApi | undefined;
  public columnDefs = columnDefs;
  public defaultColDef = defaultColDef;
  public rowData: ExperimentResult[] = [];

  private modelNumber: number = 1;
  private alpha: number = 2;
  private beta: number = 1;
  private statesAmount: number = 100;
  private experimentsAmount: number = 1000;

  private unsubscribe$ = new Subject<void>();

  ngOnInit(): void {
    this.initForm();
    this.addSubscriptions();
  }

  private initForm(): void {
    this.informationValueModelForm = new FormGroup({
      alpha: new FormControl(
        { value: 2, disabled: false }, [Validators.required, Validators.min(0)]
      ),
      beta: new FormControl(
        { value: 1, disabled: false }, [Validators.required, Validators.min(0)]
      ),
      statesAmount: new FormControl(
        { value: 100, disabled: false }, [Validators.required, Validators.min(0)]
      ),
      experimentsAmount: new FormControl(
        { value: 1000, disabled: false }, [Validators.required, Validators.min(0)]
      ),
      modelNumber: new FormControl()
    });
  }

  private addSubscriptions(): void {
    this.informationValueModelForm.get('alpha')?.valueChanges.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((alpha: number) => {
      this.alpha = alpha;
    });

    this.informationValueModelForm.get('beta')?.valueChanges.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((beta: number) => {
      this.beta = beta;
    });

    this.informationValueModelForm.get('statesAmount')?.valueChanges.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((statesAmount: number) => {
      this.statesAmount = statesAmount;
    });

    this.informationValueModelForm.get('experimentsAmount')?.valueChanges.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((experimentsAmount: number) => {
      this.experimentsAmount = experimentsAmount;
    });

    this.informationValueModelForm.get('modelNumber')?.valueChanges.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((modelNumber: number) => {
      this.modelNumber = modelNumber
    });
  }

  public onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  public onGridSizeChanged() {
    if (this.gridApi) {
      this.gridApi.sizeColumnsToFit();
    }
  }

  // Uniform probability distribution with random state selection model
  private uniformDistributionModel() {
    const states = this.getUniformStates();
    const actualState = states.find((state: State) => state.isActual);

    if (!actualState) {
      return;
    }

    const priorResult = { wins: 0, loses: 0 };
    const posteriorResult = { wins: 0, loses: 0 };

    for (let i = 0; i < this.experimentsAmount; i++) {
      const userMessage = this.getInformationMessage(states, actualState, 20);
      const watcherMessage = this.getInformationMessage(states, actualState, 20);
      const intersection = this.getMessageIntersection(userMessage, watcherMessage);

      const priorState = this.getRandomStateFromMessage(userMessage);
      priorState.id === actualState.id ? priorResult.wins++ : priorResult.loses++;

      const posteriorState = this.getRandomStateFromMessage(intersection);
      posteriorState.id === actualState.id ? posteriorResult.wins++ : posteriorResult.loses++;
    }

    const priorInformationAverageProfit = this.getAverageProfit(priorResult);
    const posteriorInformationAverageProfit = this.getAverageProfit(posteriorResult);

    const informationValue = posteriorInformationAverageProfit- priorInformationAverageProfit;

    const experimentResult: ExperimentResult = {
      modelNumber: this.modelNumber,
      alpha: this.alpha,
      beta: this.beta,
      statesAmount: this.statesAmount,
      experimentsAmount: this.experimentsAmount,
      priorProfit: priorInformationAverageProfit,
      posteriorProfit: posteriorInformationAverageProfit,
      informationValue
    };

    this.rowData.push(experimentResult);
    this.gridApi?.setRowData(this.rowData);
  }

  // Non-uniform probability distribution with most probable state selection
  private nonUniformDistributionBasicModel() {
    // @ts-ignore
    const weightedSample = (states: State[]) => {
      const total = Object.values(states).reduce((sum: number, state: State) => sum + state.probability, 0);

      const random = Math.random() * total;
      let accumulator = 0;

      for (const state of states) {
        accumulator += state.probability;

        if (random < accumulator) {
          return state;
        }
      }
    }

    const states: State[] = [
      { id: 1, probability: 30, isActual: false },
      { id: 2, probability: 15, isActual: false },
      { id: 3, probability: 10, isActual: false },
      { id: 4, probability: 5, isActual: false },
      { id: 5, probability: 20, isActual: false },
      { id: 6, probability: 10, isActual: false },
      { id: 7, probability: 5, isActual: false },
      { id: 8, probability: 5, isActual: false },
    ];

    const result = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0 }
    for (let i = 0; i < 1e6; ++i) {
      // @ts-ignore
      const state: State = weightedSample(states);

      // @ts-ignore
      result[String(state.id)]++;
    }
    console.log(result);
  }
  // Non-uniform probability distribution with random state selection
  private nonUniformDistributionAdvancedModel() {
    alert('Future functionality');
  }

  // Helpers methods
  private getInformationMessage(array: State[], actualState: State, statesAmount: number) {
    const filteredArray = array.filter((state: State) => !state.isActual);
    const shuffledArray = [...filteredArray].sort(() => 0.5 - Math.random());

    return [...shuffledArray.slice(0, statesAmount - 1), actualState].sort(() => 0.5 - Math.random());
  }

  private getMessageIntersection(userMessage: State[], watcherMessage: State[]) {
    const intersection: State[] = [];

    userMessage.forEach((priorState: State) => {
      watcherMessage.forEach((posteriorState: State) => {
        if (priorState.id === posteriorState.id) {
          intersection.push(posteriorState);
        }
      });
    });

    return intersection;
  }

  private getRandomStateFromMessage(message: State[]) {
    const randomIndex = Math.floor(Math.random() * message.length);

    return message[randomIndex];
  }

  private getAverageProfit(experimentResult: { wins: number, loses: number }) {
    return this.alpha * (experimentResult.wins / this.experimentsAmount)
      + this.beta * (experimentResult.loses / this.experimentsAmount);
  }

  private getUniformStates(): State[] {
    const actualConditionNumber = Math.floor(Math.random() * this.statesAmount);

    const conditions = [];

    for (let i = 0; i < this.statesAmount; i++) {
      const isActual = i === actualConditionNumber;

      const condition = { id: i, probability: 1 / this.statesAmount, isActual };
      conditions.push(condition)
    }

    return conditions;
  }

  private weightedSample(states: State[]) {
    states = states.map((state: State) => {
      return { id: state.id, probability: state.probability * 100, isActual: false };
    });

    const total = Object.values(states).reduce((sum, state) => sum + state.probability, 0);

    const rnd = Math.random() * total;
    let accumulator = 0

    for (const [item, state] of Object.entries(states)) {
      accumulator += state.probability

      if (rnd < accumulator) {
        return item;
      }
    }

    return;
  }

  // Buttons
  public onRunModelClick() {
    if (this.informationValueModelForm.invalid) {
      this.informationValueModelForm.markAllAsTouched();
      this.informationValueModelForm.markAsDirty();

      return;
    }

    switch (this.modelNumber) {
      case 1:
        this.uniformDistributionModel();
        break;
      case 2:
        this.nonUniformDistributionBasicModel();
        break;
      case 3:
        this.nonUniformDistributionAdvancedModel();
        break;
      default:
        break;
    }
  }

  public onClearTable() {
    this.rowData = [];
    this.gridApi?.setRowData(this.rowData);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.complete();
    this.unsubscribe$.next();
  }
}
