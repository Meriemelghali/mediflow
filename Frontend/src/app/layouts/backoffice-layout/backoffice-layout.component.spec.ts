import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackofficeLayoutComponent } from './backoffice-layout.component';

describe('BackofficeLayoutComponent', () => {
  let component: BackofficeLayoutComponent;
  let fixture: ComponentFixture<BackofficeLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackofficeLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackofficeLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
