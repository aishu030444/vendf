import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DebitmemoComponent } from './debitmemo.component';

describe('DebitmemoComponent', () => {
  let component: DebitmemoComponent;
  let fixture: ComponentFixture<DebitmemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DebitmemoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DebitmemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
