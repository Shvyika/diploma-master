import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { GridApi, GridReadyEvent } from 'ag-grid-community';
import { Subject, takeUntil } from 'rxjs';

import { State } from '../shared/entities/condition.interface';
import { ExperimentResult } from '../shared/entities/experiment-result.interface';

import { columnDefs, defaultColDef } from './information-value-model-grid.config';
import { LoaderService } from '../shared/services/loader.service';

@Component({
  selector: 'app-information-value-model',
  templateUrl: './information-value-model.component.html',
  styleUrls: ['./information-value-model.component.scss']
})
export class InformationValueModelComponent implements OnInit, OnDestroy {
  private EMPTY_STATE: State = { id: 0, probability: 0 };

  public informationValueModelForm: FormGroup = new FormGroup({});

  private gridApi: GridApi | undefined;
  public columnDefs = columnDefs;
  public defaultColDef = defaultColDef;
  public rowData: ExperimentResult[] = [];

  private modelNumber: number = 1;
  private alpha: number = 2;
  private beta: number = 1;
  private experimentsAmount: number = 100;
  private guessingAmount: number = 100;
  private statesAmount: number = 100;
  private userStatesAmount: number = 20;
  private watcherStatesAmount: number = 20;
  private statesPercent: number = 25;

  private unsubscribe$ = new Subject<void>();

  constructor(private loaderService: LoaderService) { }

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
        { value: 1, disabled: false },
        [Validators.required, Validators.min(1)]
      ),
      guessingAmount: new FormControl(
        { value: 100, disabled: false },
        [Validators.required, Validators.min(1), Validators.max(1000)]
      ),
      experimentsAmount: new FormControl(
        { value: 100, disabled: false },
        [Validators.required, Validators.min(1), Validators.max(1000)]
      ),
      statesAmount: new FormControl(
        { value: 100, disabled: false },
        [Validators.required, Validators.min(1)]
      ),
      userStatesAmount: new FormControl(
        { value: 20, disabled: false },
        [Validators.required, Validators.min(1)]
      ),
      watcherStatesAmount: new FormControl(
        { value: 20, disabled: false },
        [Validators.required, Validators.min(1)]
      ),
      statesPercent: new FormControl(
        { value: 25, disabled: true },
        [Validators.required, Validators.min(1), Validators.max(100)]
      )
    });
  }

  private addSubscriptions(): void {
    this.informationValueModelForm.get('modelNumber')?.valueChanges.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((modelNumber: number) => {
      this.modelNumber = modelNumber;

      this.modelNumber === 4
        ? this.informationValueModelForm.get('statesPercent')?.enable()
        : this.informationValueModelForm.get('statesPercent')?.disable();
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

    this.informationValueModelForm.get('experimentsAmount')?.valueChanges.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((experimentsAmount: number) => {
      this.experimentsAmount = experimentsAmount;
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

    this.informationValueModelForm.get('statesPercent')?.valueChanges.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe((statesPercent: number) => {
      this.statesPercent = statesPercent;
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

  private runModel(states: State[]) {
    const actualState = this.modelNumber === 1 ? this.getUniformActualState(states) : this.getNonUniformActualState(states);

    const priorGuessingResult = { wins: 0, loses: 0 };
    const posteriorGuessingResult = { wins: 0, loses: 0 };

    for (let i = 0; i < this.guessingAmount; i++) {
      const userMessage = this.getMessage(states, actualState, this.userStatesAmount);
      const watcherMessage = this.getMessage(states, actualState, this.watcherStatesAmount);
      const intersection = this.getMessagesIntersection(userMessage, watcherMessage);

      const priorGuessedState = this.getGuessedState(userMessage);
      priorGuessedState.id === actualState.id ? priorGuessingResult.wins++ : priorGuessingResult.loses++;

      const posteriorGuessedState = this.getGuessedState(intersection);
      posteriorGuessedState.id === actualState.id ? posteriorGuessingResult.wins++ : posteriorGuessingResult.loses++;
    }

    const priorProfit = this.getAverageProfit(priorGuessingResult);
    const posteriorProfit = this.getAverageProfit(posteriorGuessingResult);
    const informationValue = posteriorProfit - priorProfit;

    return { priorProfit, posteriorProfit, informationValue };
  }

  private runExperiment() {
    const states = this.modelNumber === 1 ? this.getUniformStates() : this.getNonUniformStates();

    const priorProfits = [];
    const posteriorProfits = [];
    const informationValues = [];

    for (let i = 0; i < this.experimentsAmount; i++) {
      const modelResult = this.runModel(states);

      priorProfits.push(modelResult.priorProfit);
      posteriorProfits.push(modelResult.posteriorProfit);
      informationValues.push(modelResult.informationValue);
    }

    const experimentResult: ExperimentResult = {
      modelNumber: this.modelNumber,
      averagePriorProfit: priorProfits.reduce((x: number, y: number) => x + y) / priorProfits.length,
      averagePosteriorProfit: posteriorProfits.reduce((x: number, y: number) => x + y) / posteriorProfits.length,
      averageInformationValue: informationValues.reduce((x: number, y: number) => x + y) / informationValues.length
    };

    this.rowData.unshift(experimentResult);
    this.gridApi?.setRowData(this.rowData);

    this.loaderService.decreaseLoaderCallCounter$.next();
  }

  // Helpers methods
  private getUniformStates(): State[] {
    const states = [];

    for (let i = 1; i <= this.statesAmount; i++) {
      const state = { id: i, probability: 0 };

      states.push(state);
    }

    return states;
  }

  private getUniformActualState(states: State[]) {
    const actualStateNumber = Math.floor(Math.random() * states.length) + 1;

    return states[actualStateNumber - 1];
  }

  private getNonUniformStates() {
    const sum = (this.statesAmount * (this.statesAmount + 1)) / 2;

    const states = [];

    for (let i = 1; i <= this.statesAmount; i++) {
      const state = { id: i, probability: i / sum };
      states.push(state);
    }

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

    return this.EMPTY_STATE;
  }

  private getMessage(states: State[], actualState: State, statesAmount: number) {
    const filteredArray = [...states].filter((state: State) => state.id !== actualState.id);
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

  private getGuessedState(message: State[]) {
    switch (this.modelNumber) {
      case 1:
      case 2:
        return this.getRandomStateFromMessage(message);
      case 3:
        return this.getMostProbableStateFromMessage(message);
      case 4:
        return this.getRandomStateFromMostProbableSubMessage(message);
      default:
        return this.EMPTY_STATE;
    }
  }

  private getRandomStateFromMessage(message: State[]) {
    const randomStateNumber = Math.floor(Math.random() * message.length);

    return message[randomStateNumber];
  }

  private getMostProbableStateFromMessage(message: State[]) {
    const sortedArray = [...message].sort((a: State, b: State) => a.probability - b.probability);

    return sortedArray[sortedArray.length - 1];
  }

  private getRandomStateFromMostProbableSubMessage(message: State[]) {
    const mostProbableSubMessage = message
      .sort((a: State, b: State) => b.probability - a.probability)
      .slice(0, Math.ceil(message.length * (this.statesPercent / 100)));

    return this.getRandomStateFromMessage(mostProbableSubMessage);
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
    this.loaderService.increaseLoaderCallCounter$.next();

    this.runExperiment();
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
