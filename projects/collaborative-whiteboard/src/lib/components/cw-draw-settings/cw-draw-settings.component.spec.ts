import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CwDrawSettingsComponent } from './cw-draw-settings.component';

describe('CwDrawSettingsComponent', () => {
  let component: CwDrawSettingsComponent;
  let fixture: ComponentFixture<CwDrawSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CwDrawSettingsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CwDrawSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
