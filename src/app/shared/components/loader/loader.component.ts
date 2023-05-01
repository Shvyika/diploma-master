import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent implements OnInit, OnDestroy {
  private counter: number = 0;

  isLoading: boolean = false;

  private unsubscribe$ = new Subject<void>();

  constructor(
    private loaderService: LoaderService
  ) {}

  ngOnInit() {
    this.addSubscriptions();
  }

  private addSubscriptions() {
    this.loaderService.increaseLoaderCallCounter$.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(() => {
      this.counter++;

      this.isLoading = (this.counter > 0);
    });

    this.loaderService.decreaseLoaderCallCounter$.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(() => {
      this.counter--;

      this.isLoading = (this.counter > 0);
    });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
