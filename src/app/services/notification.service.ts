import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private snackBar: MatSnackBar) {}

  success(message: string, duration = 3000): void {
    this.snackBar.open(message, 'Close', { duration });
  }

  error(message: string, duration = 5000): void {
    this.snackBar.open(message, 'Close', { duration });
  }

  /** Notify CRUD success: e.g. saved('Portfolio item') → 'Portfolio item saved successfully' */
  saved(entity: string): void {
    this.success(`${entity} saved successfully`);
  }

  created(entity: string): void {
    this.success(`${entity} created successfully`);
  }

  updated(entity: string): void {
    this.success(`${entity} updated successfully`);
  }

  deleted(entity: string): void {
    this.success(`${entity} deleted successfully`);
  }

  saveError(entity: string, err?: unknown): void {
    const detail = err ? `: ${err}` : '';
    this.error(`Error saving ${entity}${detail}`);
  }

  deleteError(entity: string): void {
    this.error(`Error deleting ${entity}`);
  }
}
