import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Juego2RemakeComponent } from './juego2-remake.component';

describe('Juego2RemakeComponent', () => {
  let component: Juego2RemakeComponent;
  let fixture: ComponentFixture<Juego2RemakeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Juego2RemakeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Juego2RemakeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
