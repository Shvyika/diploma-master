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
  private guessingAmount: number = 1000;
  private statesAmount: number = 100;
  private userStatesAmount: number = 20;
  private watcherStatesAmount: number = 20;

  private unsubscribe$ = new Subject<void>();

  ngOnInit(): void {
    this.initForm();
    this.addSubscriptions();
  }

  private initForm(): void {
    this.informationValueModelForm = new FormGroup({
      modelNumber: new FormControl(),
      alpha: new FormControl(
        { value: 2, disabled: false }, [Validators.required, Validators.min(1)]
      ),
      beta: new FormControl(
        { value: 1, disabled: false }, [Validators.required, Validators.min(1)]
      ),
      guessingAmount: new FormControl(
        { value: 1000, disabled: false }, [Validators.required, Validators.min(1)]
      ),
      statesAmount: new FormControl(
        { value: 100, disabled: false }, [Validators.required, Validators.min(1)]
      ),
      userStatesAmount: new FormControl(
        { value: 20, disabled: false }, [Validators.required, Validators.min(1)]
      ),
      watcherStatesAmount: new FormControl(
        { value: 20, disabled: false }, [Validators.required, Validators.min(1)]
      )
    });
  }

  private addSubscriptions(): void {
    this.informationValueModelForm.get('modelNumber')?.valueChanges.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((modelNumber: number) => {
      this.modelNumber = modelNumber
    });

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

    this.informationValueModelForm.get('guessingAmount')?.valueChanges.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((guessingAmount: number) => {
      this.guessingAmount = guessingAmount;
    });

    this.informationValueModelForm.get('statesAmount')?.valueChanges.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((statesAmount: number) => {
      this.statesAmount = statesAmount;
    });

    this.informationValueModelForm.get('userStatesAmount')?.valueChanges.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((userStatesAmount: number) => {
      this.userStatesAmount = userStatesAmount;
    });

    this.informationValueModelForm.get('watcherStatesAmount')?.valueChanges.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((watcherStatesAmount: number) => {
      this.watcherStatesAmount = watcherStatesAmount;
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

  private runModel() {
    const states = this.modelNumber === 1 ? this.getUniformStates() : this.getNonUniformStates();
    const actualState = states.find((state: State) => state.isActual) as State;

    const priorGuessingResult = { wins: 0, loses: 0 };
    const posteriorGuessingResult = { wins: 0, loses: 0 };

    for (let i = 0; i < this.guessingAmount; i++) {
      const userMessage = this.getMessage(states, actualState, this.userStatesAmount);
      const watcherMessage = this.getMessage(states, actualState, this.watcherStatesAmount);
      const intersection = this.getMessagesIntersection(userMessage, watcherMessage);

      const priorGuessedState = this.modelNumber === 3
        ? this.getMostProbableStateFromMessage(userMessage)
        : this.getRandomStateFromMessage(userMessage);
      priorGuessedState.id === actualState.id ? priorGuessingResult.wins++ : priorGuessingResult.loses++;

      const posteriorGuessedState = this.modelNumber === 3
        ? this.getMostProbableStateFromMessage(intersection)
        : this.getRandomStateFromMessage(intersection);
      posteriorGuessedState.id === actualState.id ? posteriorGuessingResult.wins++ : posteriorGuessingResult.loses++;
    }

    const priorAverageProfit = this.getAverageProfit(priorGuessingResult);
    const posteriorAverageProfit = this.getAverageProfit(posteriorGuessingResult);

    const informationValue = posteriorAverageProfit - priorAverageProfit;

    const experimentResult: ExperimentResult = {
      modelNumber: this.modelNumber,
      alpha: this.alpha,
      beta: this.beta,
      statesAmount: this.statesAmount,
      guessingAmount: this.guessingAmount,
      priorAverageProfit,
      posteriorAverageProfit,
      informationValue
    };

    this.rowData.push(experimentResult);
    this.gridApi?.setRowData(this.rowData);
  }

  // Helpers methods
  private getUniformStates(): State[] {
    const actualStateId = Math.floor(Math.random() * this.statesAmount) + 1;

    const states = [];

    for (let i = 1; i <= this.statesAmount; i++) {
      const state = { id: i, probability: 1 / this.statesAmount, isActual: i === actualStateId};
      states.push(state);
    }

    return states;
  }

  private getNonUniformStates() {
    const sum = (this.statesAmount * (this.statesAmount + 1)) / 2;

    const states = [];

    for (let i = 1; i <= this.statesAmount; i++) {
      const state = { id: i, probability: i / sum, isActual: false };
      states.push(state);
    }

    const actualState = this.getNonUniformActualState(states);
    states[actualState.id - 1].isActual = true;

    return states;
  }

  private getNonUniformActualState(states: State[]) {
    const total = Object.values(states).reduce((sum: number, state: State) => sum + state.probability, 0);

    const random = Math.random() * total;
    let accumulator = 0;

    for (const state of states) {
      accumulator += state.probability;

      if (random < accumulator) {
        return state;
      }
    }

    return { id: 0, probability: 0, isActual: false };
  }

  private getMessage(states: State[], actualState: State, statesAmount: number) {
    const filteredArray = [...states].filter((state: State) => !state.isActual);
    const shuffledArray = [...filteredArray].sort(() => 0.5 - Math.random());

    return [...shuffledArray.slice(0, statesAmount - 1), actualState].sort(() => 0.5 - Math.random());
  }

  private getMessagesIntersection(userMessage: State[], watcherMessage: State[]) {
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
    const randomStateNumber = Math.floor(Math.random() * message.length);

    return message[randomStateNumber];
  }

  private getMostProbableStateFromMessage(message: State[]) {
    const sortedArray = [...message].sort((a: State, b: State) => a.probability - b.probability);

    return sortedArray[sortedArray.length - 1];
  }

  private getAverageProfit(guessingResults: { wins: number, loses: number }) {
    return this.alpha * (guessingResults.wins / this.guessingAmount)
      + this.beta * (guessingResults.loses / this.guessingAmount);
  }

  // Buttons
  public onRunModelClick() {
    if (this.informationValueModelForm.invalid) {
      this.informationValueModelForm.markAllAsTouched();
      this.informationValueModelForm.markAsDirty();

      return;
    }

    this.runModel();
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
