import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Auth {

  private readonly TOKEN_KEY = 'falcon_token';

  private readonly USER_KEY = 'falcon_user';

  login(
    email: string,
    password: string,
    rememberMe: boolean = true
  ): boolean {

    // Temporary authentication
    // This will be replaced with a NestJS API call later.

    if (
      email === 'admin@falconai.co.za' &&
      password === 'Admin@123'
    ) {

      const token = 'falcon-demo-token';

      const user = {
        name: 'System Administrator',
        email,
        role: 'Admin'
      };

      const storage = rememberMe
        ? localStorage
        : sessionStorage;

      storage.setItem(
        this.TOKEN_KEY,
        token
      );

      storage.setItem(
        this.USER_KEY,
        JSON.stringify(user)
      );

      return true;

    }

    return false;

  }

  logout(): void {

    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);

  }

  isAuthenticated(): boolean {

    return !!this.getToken();

  }

  getToken(): string | null {

    return (
      localStorage.getItem(this.TOKEN_KEY) ||
      sessionStorage.getItem(this.TOKEN_KEY)
    );

  }

  getCurrentUser(): any {

    const user =

      localStorage.getItem(this.USER_KEY) ||

      sessionStorage.getItem(this.USER_KEY);

    return user
      ? JSON.parse(user)
      : null;

  }

}