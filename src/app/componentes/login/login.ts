import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../servicios/auth';
import { NotificacionesService } from '../../servicios/notificaciones';
import { LoginRequest } from '../../modelos/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private auth = inject(AuthService);
  private avisos = inject(NotificacionesService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  isLoading = signal(false);
  errorMensaje = signal('');

  // Formulario reactivo con validaciones: ambos campos obligatorios y el correo con formato válido
  loginForm = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  get email() { return this.loginForm.controls.email; }
  get password() { return this.loginForm.controls.password; }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched(); // muestra los mensajes de los campos pendientes
      return;
    }
    this.errorMensaje.set('');
    this.isLoading.set(true);

    this.auth.login(this.loginForm.getRawValue() as LoginRequest)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.avisos.exito(`Bienvenido, ${respuesta.nombre}`);
          this.isLoading.set(false);
          this.router.navigate(['/catalogo']);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMensaje.set(this.traducirError(err));
          this.isLoading.set(false);
        }
      });
  }

  // Traduce el código HTTP a un mensaje que una persona entienda
  private traducirError(err: HttpErrorResponse): string {
    if (err.status === 401) return 'Correo o contraseña incorrectos.';
    if (err.status === 400) return 'Revisa los datos ingresados.';
    if (err.status === 0) return 'No se pudo conectar con el servidor. ¿Está encendido el backend?';
    return 'Ocurrió un error. Intenta de nuevo más tarde.';
  }
}