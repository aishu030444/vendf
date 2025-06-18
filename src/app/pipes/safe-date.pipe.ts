import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'safeDate'
})
export class SafeDatePipe implements PipeTransform {

  constructor(private datePipe: DatePipe) {}

  transform(value: any, format: string = 'MMM yyyy'): string {
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return this.datePipe.transform(date, format) || '';
    } catch {
      return 'Invalid Date';
    }
  }
}
