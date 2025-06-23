import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Trip, ItineraryItem } from './models/itinerary.model';

@Injectable({
  providedIn: 'root'
})
export class ItineraryService {
  private baseUrl = 'http://localhost/final-asp-php/'; // Use your PHP backend URL

  constructor(private http: HttpClient) { }

  getUserTrips(userId: number): Observable<Trip[]> {
    return this.http.get<any>(`${this.baseUrl}get_user_trips.php?user_id=${userId}`)
      .pipe(
        map(response => {
          if (response.status === 'success') {
            return response.trips || [];
          } else {
            throw new Error(response.message || 'Failed to get trips');
          }
        }),
        catchError(this.handleError)
      );
  }

  getTripById(tripId: number): Observable<Trip> {
    return this.http.get<Trip>(`${this.baseUrl}get_trip.php?trip_id=${tripId}`)
      .pipe(catchError(this.handleError));
  }

  createTrip(trip: Omit<Trip, 'id' | 'itinerary'>): Observable<Trip> {
    return this.http.post<any>(`${this.baseUrl}create_trip.php`, trip)
      .pipe(
        map(response => {
          if (response.status === 'success') {
            return response.trip;
          } else {
            throw new Error(response.message || 'Failed to create trip');
          }
        }),
        catchError(this.handleError)
      );
  }

  updateTrip(trip: Partial<Trip>): Observable<Trip> {
    return this.http.post<any>(`${this.baseUrl}update_trip.php`, trip)
      .pipe(
        map(response => {
          if (response.status === 'success') {
            return { ...trip } as Trip;
          } else {
            throw new Error(response.message || 'Failed to update trip');
          }
        }),
        catchError(this.handleError)
      );
  }

  deleteTrip(tripId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}delete_trip.php?trip_id=${tripId}`)
      .pipe(
        map(response => {
          if (response.status === 'success') {
            return response;
          } else {
            throw new Error(response.message || 'Failed to delete trip');
          }
        }),
        catchError(this.handleError)
      );
  }

  addItineraryItem(tripId: number, item: Omit<ItineraryItem, 'id' | 'trip_id' | 'completed'>): Observable<ItineraryItem> {
    return this.http.post<any>(`${this.baseUrl}add_itinerary_item.php`, { tripId, item })
      .pipe(
        map(response => {
          if (response.status === 'success') {
            return response;
          } else {
            throw new Error(response.message || 'Failed to add itinerary item');
          }
        }),
        catchError(this.handleError)
      );
  }

  updateItineraryItem(item: ItineraryItem): Observable<ItineraryItem> {
    return this.http.post<any>(`${this.baseUrl}update_itinerary_item.php`, item)
      .pipe(
        map(response => {
          if (response.status === 'success') {
            return item;
          } else {
            throw new Error(response.message || 'Failed to update itinerary item');
          }
        }),
        catchError(this.handleError)
      );
  }

  deleteItineraryItem(itemId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}delete_itinerary_item.php?item_id=${itemId}`)
      .pipe(
        map(response => {
          if (response.status === 'success') {
            return response;
          } else {
            throw new Error(response.message || 'Failed to delete itinerary item');
          }
        }),
        catchError(this.handleError)
      );
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.status) {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}