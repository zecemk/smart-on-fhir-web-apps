import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShcComponent } from './shc.component';

describe('ShcComponent', () => {
  let component: ShcComponent;
  let fixture: ComponentFixture<ShcComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShcComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
