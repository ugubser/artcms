import { Pipe, PipeTransform } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { StorageUrlService } from '../services/storage-url.service';

@Pipe({
  name: 'resolveStorageUrl',
  standalone: true
})
export class ResolveStorageUrlPipe implements PipeTransform {

  constructor(private storageUrlService: StorageUrlService) {}

  transform(pathOrUrl: string): Observable<string> {
    if (!pathOrUrl) {
      return of('');
    }
    
    return this.storageUrlService.resolveUrl(pathOrUrl);
  }
}