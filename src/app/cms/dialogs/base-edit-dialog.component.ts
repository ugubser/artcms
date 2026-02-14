import { Directive, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificationService } from '../../services/notification.service';

/**
 * Abstract base for CMS edit dialogs.
 * Subclasses must implement createForm(), buildEntity(), and saveEntity().
 */
@Directive()
export abstract class BaseEditDialogComponent<TData, TEntity> {
  form: FormGroup;
  isEdit: boolean;
  saving = false;

  constructor(
    protected fb: FormBuilder,
    protected notify: NotificationService,
    protected dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: TData,
    protected entityName: string
  ) {
    this.isEdit = this.checkIsEdit(data);
    this.form = this.createForm();
  }

  /** Override to define when we're in edit mode */
  protected checkIsEdit(data: TData): boolean {
    return !!(data as any)?.item || !!(data as any)?.section || !!(data as any)?.contactInfo || !!(data as any)?.settings || !!(data as any)?.page;
  }

  /** Create the reactive form with validators */
  protected abstract createForm(): FormGroup;

  /** Build the entity object from form values */
  protected abstract buildEntity(): TEntity;

  /** Persist the entity (create or update) */
  protected abstract saveEntity(entity: TEntity): Promise<void>;

  onCancel(): void {
    this.dialogRef.close();
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    this.saving = true;
    try {
      const entity = this.buildEntity();
      await this.saveEntity(entity);
      this.dialogRef.close(true);
    } catch (error) {
      this.notify.saveError(this.entityName, error);
    } finally {
      this.saving = false;
    }
  }
}
