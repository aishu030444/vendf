import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialMemoComponent } from './financial-memo.component';

describe('FinancialMemoComponent', () => {
  let component: FinancialMemoComponent;
  let fixture: ComponentFixture<FinancialMemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialMemoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialMemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
