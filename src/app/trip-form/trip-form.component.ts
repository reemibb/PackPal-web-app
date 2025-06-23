import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { ItineraryService } from '../itinerary.service';
import { Trip } from '../models/itinerary.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-trip-form',
  templateUrl: './trip-form.component.html',
  styleUrls: ['./trip-form.component.css'],
  standalone: false,
})
export class TripFormComponent implements OnInit, OnDestroy {
  tripForm: FormGroup;
  isEditMode = false;
  tripId: number | null = null;
  loading = false;
  error = '';
  userId: number = 0;
  minDate: string;
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private itineraryService: ItineraryService
  ) {
    // Create trip form
    this.tripForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      destination: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    }, { validators: this.dateRangeValidator });
    
    // Set minimum date to today
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.userId = Number(localStorage.getItem('user_id') || '0');
    
    if (this.userId <= 0) {
      this.error = 'You must be logged in to create or edit trips';
      return;
    }
    
    const tripId = this.route.snapshot.paramMap.get('id');
    
    if (tripId && tripId !== 'new') {
      this.isEditMode = true;
      this.tripId = Number(tripId);
      this.loadTrip(this.tripId);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadTrip(tripId: number): void {
    this.loading = true;
    const sub = this.itineraryService.getTripById(tripId)
      .subscribe({
        next: (trip) => {
          this.tripForm.patchValue({
            title: trip.title,
            destination: trip.destination,
            startDate: trip.startDate,
            endDate: trip.endDate
          });
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading trip', error);
          this.error = 'Failed to load trip details. Please try again.';
          this.loading = false;
        }
      });
    
    this.subscriptions.push(sub);
  }

  saveTrip(): void {
    if (this.tripForm.invalid) {
      this.tripForm.markAllAsTouched();
      return;
    }
    
    this.loading = true;
    
    if (this.isEditMode && this.tripId) {
      // Update existing trip
      const updatedTrip = {
        ...this.tripForm.value,
        id: this.tripId
      };
      
      const sub = this.itineraryService.updateTrip(updatedTrip)
        .subscribe({
          next: (trip) => {
            this.router.navigate(['/home/trips', this.tripId]);
          },
          error: (error) => {
            console.error('Error updating trip', error);
            this.error = 'Failed to update trip. Please try again.';
            this.loading = false;
          }
        });
      
      this.subscriptions.push(sub);
    } else {
      // Create new trip
      const newTrip = {
        ...this.tripForm.value,
        user_id: this.userId
      };
      
      const sub = this.itineraryService.createTrip(newTrip)
        .subscribe({
          next: (trip) => {
            this.router.navigate(['/home/trips', trip.id]);
          },
          error: (error) => {
            console.error('Error creating trip', error);
            this.error = 'Failed to create trip. Please try again.';
            this.loading = false;
          }
        });
      
      this.subscriptions.push(sub);
    }
  }
  
  cancel(): void {
  if (this.isEditMode && this.tripId) {
    this.router.navigate(['/home/trips', this.tripId]);
  } else {
    this.router.navigate(['/home/trips']);
  }
}
  
  // Custom validator for date range
  dateRangeValidator(group: FormGroup): {[key: string]: any} | null {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;
    
    if (start && end && new Date(start) > new Date(end)) {
      return { 'dateRange': true };
    }
    
    return null;
  }
}