import { Component, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

import { Auth } from '../services/auth';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  private readonly auth =
    inject(Auth);

  private readonly router =
    inject(Router);


  email =
    '';


  password =
    '';


  rememberMe =
    true;


  showPassword =
    false;


  isLoading =
    false;


  errorMessage =
    '';


  login(): void {

    this.errorMessage = '';

    this.isLoading = true;


    setTimeout(() => {

      const success =
        this.auth.login(
          this.email,
          this.password,
          this.rememberMe
        );

      this.isLoading = false;

      if (success) {

        void this.router.navigate([
          '/dashboard'
        ]);

        return;

      }

      this.errorMessage =
        'Invalid email or password.';

    }, 600);

  }


  togglePassword(): void {

    this.showPassword =
      !this.showPassword;

  }

}