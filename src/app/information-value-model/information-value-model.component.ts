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

  // Uniform Probability Distribution Model
  private uniformProbabilityDistribution() {
    const states = this.generateUniformStates();
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

    console.log(priorResult);
    console.log(posteriorResult);

    const priorInformationAverageProfit = this.getAverageProfit(priorResult);
    const posteriorInformationAverageProfit = this.getAverageProfit(posteriorResult);

    console.log(priorInformationAverageProfit);
    console.log(posteriorInformationAverageProfit);

    const informationValue = posteriorInformationAverageProfit- priorInformationAverageProfit;

    console.log(informationValue);

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

  private generateUniformStates(): State[] {
    const actualConditionNumber = Math.floor(Math.random() * this.statesAmount);

    const conditions = [];

    for (let i = 0; i < this.statesAmount; i++) {
      const isActual = i === actualConditionNumber;

      const condition = { id: i, probability: 1 / this.statesAmount, isActual };
      conditions.push(condition)
    }

    return conditions;
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

  public onRunModelClick() {
    if (this.informationValueModelForm.invalid) {
      this.informationValueModelForm.markAllAsTouched();
      this.informationValueModelForm.markAsDirty();

      return;
    }

    console.log('Model:', this.modelNumber);
    console.log('Alpha:', this.alpha);
    console.log('Beta:', this.beta);
    console.log('Amount of States:', this.statesAmount);
    console.log('Amount of Experiments:', this.experimentsAmount);

    switch (this.modelNumber) {
      case 1:
        this.uniformProbabilityDistribution();
        break;
      case 2:
        alert('Future functionality');
        break;
      case 3:
        alert('Future functionality');
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

  }
}
