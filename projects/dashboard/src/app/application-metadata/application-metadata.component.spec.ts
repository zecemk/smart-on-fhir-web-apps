import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationMetadataComponent } from './application-metadata.component';

describe('ApplicationMetadataComponent', () => {
  let component: ApplicationMetadataComponent;
  let fixture: ComponentFixture<ApplicationMetadataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ApplicationMetadataComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ApplicationMetadataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
