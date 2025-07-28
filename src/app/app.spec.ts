import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { MetaService } from './services/meta.service';
import { SettingsService } from './services/settings.service';
import { AnalyticsService } from './services/analytics.service';
import { of } from 'rxjs';

describe('App', () => {
  // Mock services
  const mockMetaService = jasmine.createSpyObj('MetaService', ['updateMetaTags']);
  const mockSettingsService = jasmine.createSpyObj('SettingsService', ['getSiteSettings']);
  const mockAnalyticsService = jasmine.createSpyObj('AnalyticsService', ['initializeAnalytics']);

  beforeEach(async () => {
    // Mock the settings service to return observable with site settings
    mockSettingsService.getSiteSettings.and.returnValue(of({ siteName: 'tribecaconcepts' }));

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: MetaService, useValue: mockMetaService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: AnalyticsService, useValue: mockAnalyticsService }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have a main content element', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('main.main-content')).toBeTruthy();
  });

  it('should have a router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
