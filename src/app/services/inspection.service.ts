import { Injectable, inject } from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';


@Injectable({

  providedIn: 'root'

})


export class InspectionService {


  private http =
    inject(HttpClient);


  private apiUrl =
    'http://localhost:3000/inspections';


  createInspection(

    inspectionData: any

  ): Observable<any> {


    return this.http.post(

      this.apiUrl,

      inspectionData

    );

  }


  getInspections():

    Observable<any> {


    return this.http.get(

      this.apiUrl

    );

  }


  getInspectionById(

    id: string

  ): Observable<any> {


    return this.http.get(

      `${this.apiUrl}/${id}`

    );

  }


}