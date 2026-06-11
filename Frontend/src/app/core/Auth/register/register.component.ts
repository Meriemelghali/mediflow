import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

// Custom validator: checks that password and confirmPassword match
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm = control.get('confirmPassword');
  if (password && confirm && password.value !== confirm.value) {
    confirm.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  }
  if (confirm?.hasError('passwordMismatch')) {
    confirm.setErrors(null);
  }
  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';
  successMessage = '';

  constructor(private fb: FormBuilder, private router: Router, private http: HttpClient) {
    this.form = this.fb.group({
      firstName:       ['', [Validators.required, Validators.minLength(2)]],
      lastName:        ['', [Validators.required, Validators.minLength(2)]],
      email:           ['', [Validators.required, Validators.email]],
      phone:           [''],
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      cnamNumber:      ['']
    }, { validators: passwordMatchValidator });
  }

  togglePassword()        { this.showPassword = !this.showPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      firstName:  this.form.value.firstName,
      lastName:   this.form.value.lastName,
      email:      this.form.value.email,
      phone:      this.form.value.phone,
      password:   this.form.value.password,
      role:       'PATIENT',
      patientInfo: { cnamNumber: this.form.value.cnamNumber || null }
    };

    console.log('Payload envoyé:', payload);

    // Call the backend user-service
    this.http.post('http://localhost:8081/api/user', payload).subscribe({
      next: (res) => {
        console.log('Inscription réussie:', res);
        this.loading = false;
        this.successMessage = 'Compte créé avec succès ! Un email de bienvenue vous a été envoyé. Redirection...';
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        console.error('Erreur inscription:', err);
        this.loading = false;
        if (err.error && err.error.error === 'Email already exists') {
          this.errorMessage = 'Cet email est déjà utilisé.';
        } else {
          this.errorMessage = 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.';
        }
      }
    });
  }

  get firstName()       { return this.form.get('firstName'); }
  get lastName()        { return this.form.get('lastName'); }
  get email()           { return this.form.get('email'); }
  get password()        { return this.form.get('password'); }
  get confirmPassword() { return this.form.get('confirmPassword'); }
}
