import { Directive, HostBinding, HostListener, ElementRef, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: 'img[appImgLoading]',
  standalone: true
})
export class ImgLoadingDirective {
  @HostBinding('style.opacity') opacity = '0';
  @HostBinding('style.transition') transition = 'opacity 0.3s ease';

  private static readonly PLACEHOLDER_SVG =
    `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23e0e0e0'/%3E%3C/svg%3E`;

  private platformId = inject(PLATFORM_ID);

  constructor(private el: ElementRef<HTMLImageElement>) {}

  @HostListener('load')
  onLoad() {
    this.opacity = '1';
  }

  @HostListener('error')
  onError() {
    if (isPlatformBrowser(this.platformId)) {
      this.el.nativeElement.src = ImgLoadingDirective.PLACEHOLDER_SVG;
    }
    this.opacity = '1';
  }
}
