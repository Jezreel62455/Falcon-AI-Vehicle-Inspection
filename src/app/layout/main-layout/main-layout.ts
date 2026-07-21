import { Component, inject } from '@angular/core';

import {
  Router,
  RouterLink,
  RouterOutlet
} from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';


@Component({
  selector: 'app-main-layout',

  standalone: true,

  imports: [

    RouterLink,

    RouterOutlet,

    MatToolbarModule,

    MatSidenavModule,

    MatListModule,

    MatIconModule,

    MatButtonModule

  ],

  templateUrl: './main-layout.html',

  styleUrl: './main-layout.css'

})


export class MainLayoutComponent {


  private router =
    inject(Router);


  navigate(
    path: string
  ): void {


    this.router.navigate([
      path
    ]);


  }


}