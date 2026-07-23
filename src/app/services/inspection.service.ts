import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface UploadFileResponse {
  originalName: string;
  fileName: string;
  path: string;
}

interface UploadResponse {
  message: string;
  files: UploadFileResponse[];
}

@Injectable({
  providedIn: 'root'
})
export class InspectionService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/inspections';


  createInspection(
    inspectionData: any
  ): Observable<any> {

    return this.http.post(
      this.apiUrl,
      inspectionData
    );

  }


  uploadPhotos(
    files: File[]
  ): Observable<UploadResponse> {

    const formData = new FormData();

    files.forEach(
      file => {

        formData.append(
          'files',
          file
        );

      }
    );

    return this.http.post<UploadResponse>(
      `${this.apiUrl}/upload`,
      formData
    );

  }


  getInspections(): Observable<any> {

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