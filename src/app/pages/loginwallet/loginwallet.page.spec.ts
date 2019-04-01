import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginwalletPage } from './loginwallet.page';

describe('LoginwalletPage', () => {
  let component: LoginwalletPage;
  let fixture: ComponentFixture<LoginwalletPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoginwalletPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginwalletPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
