import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ItineraryService } from '../itinerary.service';
import { Trip } from '../models/itinerary.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-trip-list',
  templateUrl: './trip-list.component.html',
  styleUrls: ['./trip-list.component.css'],
  standalone: false
})
export class TripListComponent implements OnInit, OnDestroy {
  trips: Trip[] = [];
  loading = true;
  error = '';
  userId: number = 0;
  private subscriptions: Subscription[] = [];

  constructor(
    private itineraryService: ItineraryService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.userId = Number(localStorage.getItem('user_id') || '0');
    if (this.userId <= 0) {
      this.error = 'You must be logged in to view trips';
      this.loading = false;
      return;
    }
    
    this.loadTrips();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadTrips(): void {
    this.loading = true;
    const sub = this.itineraryService.getUserTrips(this.userId)
      .subscribe({
        next: (trips) => {
          this.trips = trips;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading trips', error);
          this.error = 'Failed to load your trips. Please try again later.';
          this.loading = false;
        }
      });
    
    this.subscriptions.push(sub);
  }

  createNewTrip(): void {
  this.router.navigate(['/home/trips/new']);
}

viewTrip(trip: Trip): void {
  this.router.navigate(['/home/trips', trip.id]);
}

  deleteTrip(event: Event, tripId: number): void {
    event.stopPropagation(); // Prevent navigation to trip details
    
    if (confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      const sub = this.itineraryService.deleteTrip(tripId)
        .subscribe({
          next: () => {
            this.trips = this.trips.filter(t => t.id !== tripId);
          },
          error: (error) => {
            console.error('Error deleting trip', error);
            alert('Failed to delete trip. Please try again.');
          }
        });
      
      this.subscriptions.push(sub);
    }
  }
  
  // Helper method to determine if a trip is upcoming, ongoing, or past
  getTripStatus(trip: Trip): 'upcoming' | 'ongoing' | 'past' {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(trip.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(trip.endDate);
    endDate.setHours(23, 59, 59, 999);
    
    if (startDate > today) {
      return 'upcoming';
    } else if (endDate < today) {
      return 'past';
    } else {
      return 'ongoing';
    }
  }
  
  // Helper method to calculate trip duration
  getTripDuration(trip: Trip): number {
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
}