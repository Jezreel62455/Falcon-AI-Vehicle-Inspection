import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';


@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings implements OnInit {


  companyName =
    'Falcon AI Vehicle Inspection';


  industry =
    'Insurance Vehicle Inspection';



  emailNotifications =
    true;


  inspectionAlerts =
    true;


  aiReviewEnabled =
    true;


  requireVinPhoto =
    true;


  requireOdometerPhoto =
    true;



  savedMessage =
    '';



  ngOnInit(): void {

    this.loadSettings();

  }




  saveSettings(): void {


    const settings = {

      companyName: this.companyName,

      industry: this.industry,

      emailNotifications: this.emailNotifications,

      inspectionAlerts: this.inspectionAlerts,

      aiReviewEnabled: this.aiReviewEnabled,

      requireVinPhoto: this.requireVinPhoto,

      requireOdometerPhoto: this.requireOdometerPhoto

    };



    localStorage.setItem(
      'falconSettings',
      JSON.stringify(settings)
    );



    this.savedMessage =
      'Settings saved successfully';



    setTimeout(() => {

      this.savedMessage = '';

    }, 3000);


  }




  loadSettings(): void {


    const saved =
      localStorage.getItem('falconSettings');



    if (!saved) {

      return;

    }



    const settings =
      JSON.parse(saved);



    this.companyName =
      settings.companyName;



    this.industry =
      settings.industry;



    this.emailNotifications =
      settings.emailNotifications;



    this.inspectionAlerts =
      settings.inspectionAlerts;



    this.aiReviewEnabled =
      settings.aiReviewEnabled;



    this.requireVinPhoto =
      settings.requireVinPhoto;



    this.requireOdometerPhoto =
      settings.requireOdometerPhoto;


  }



}