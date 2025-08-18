import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Category {
  id: string;
  label: string;
  order: number;
}

export interface CategoryData {
  categories: Category[];
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCategories();
  }

  private loadCategories(): void {
    console.log('Loading categories from /assets/data/categories.json');
    this.http.get<CategoryData>('/assets/data/categories.json').subscribe({
      next: (data) => {
        console.log('Categories loaded successfully:', data);
        const sortedCategories = data.categories.sort((a, b) => a.order - b.order);
        this.categoriesSubject.next(sortedCategories);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.categoriesSubject.next([]);
      }
    });
  }

  getCategories(): Observable<Category[]> {
    return this.categories$;
  }

  getCategoriesForSelect(): Observable<{value: string, label: string}[]> {
    return this.categories$.pipe(
      map(categories => categories.map(cat => ({
        value: cat.id,
        label: cat.label
      })))
    );
  }

  getCategoryLabel(categoryId: string): Observable<string> {
    return this.categories$.pipe(
      map(categories => {
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.label : categoryId;
      })
    );
  }

  getCategoryLabelSync(categoryId: string): string {
    const categories = this.categoriesSubject.value;
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.label : categoryId;
  }

  getCategoriesArray(): Category[] {
    return this.categoriesSubject.value;
  }
}