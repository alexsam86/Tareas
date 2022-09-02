import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Intento1Component } from './intento1.component';

describe('Intento1Component', () => {
  let component: Intento1Component;
  let fixture: ComponentFixture<Intento1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Intento1Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Intento1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
