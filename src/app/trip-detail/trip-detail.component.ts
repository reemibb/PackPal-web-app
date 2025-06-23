import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ItineraryService } from '../itinerary.service';
import { Trip, ItineraryItem } from '../models/itinerary.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-trip-detail',
  templateUrl: './trip-detail.component.html',
  styleUrls: ['./trip-detail.component.css'],
  standalone: false
})
export class TripDetailComponent implements OnInit, OnDestroy {
  trip: Trip | null = null;
  loading = true;
  error = '';
  tripDays: Date[] = [];
  selectedDay: Date | null = null;
  dayActivities: ItineraryItem[] = [];
  activityForm: FormGroup;
  isEditing = false;
  editingItemId: number | null = null;
  userId: number = 0;
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private itineraryService: ItineraryService,
    private fb: FormBuilder
  ) {
    this.activityForm = this.fb.group({
      time: ['', Validators.required],
      activity: ['', Validators.required],
      location: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.userId = Number(localStorage.getItem('user_id') || '0');
    
    if (this.userId <= 0) {
      this.error = 'You must be logged in to view trip details';
      this.loading = false;
      return;
    }
    
    const tripId = Number(this.route.snapshot.paramMap.get('id'));
    if (tripId) {
      this.loadTrip(tripId);
    } else {
      this.error = 'No trip ID provided';
      this.loading = false;
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
          this.trip = trip;
          this.generateTripDays();
          if (this.tripDays.length > 0) {
            this.selectDay(this.tripDays[0]);
          }
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

  generateTripDays(): void {
    if (!this.trip) return;
    
    const start = new Date(this.trip.startDate);
    const end = new Date(this.trip.endDate);
    const days = [];
    
    for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
      days.push(new Date(day));
    }
    
    this.tripDays = days;
  }

  selectDay(date: Date): void {
    this.selectedDay = date;
    this.loadDayActivities();
  }

  loadDayActivities(): void {
    if (!this.trip || !this.selectedDay) return;
    
    // Calculate day number (1-based) from trip start
    const start = new Date(this.trip.startDate);
    const selected = new Date(this.selectedDay);
    const dayNumber = Math.floor((selected.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    
    this.dayActivities = this.trip.itinerary
      .filter(item => item.day === dayNumber)
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  addActivity(): void {
    if (!this.trip || !this.selectedDay || this.activityForm.invalid) return;
    
    // Calculate day number
    const start = new Date(this.trip.startDate);
    const selected = new Date(this.selectedDay);
    const dayNumber = Math.floor((selected.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    
    const newActivity = {
      ...this.activityForm.value,
      day: dayNumber
    };
    
    const sub = this.itineraryService.addItineraryItem(this.trip.id, newActivity)
      .subscribe({
        next: (item) => {
          if (this.trip) {
            this.trip.itinerary.push(item);
            this.loadDayActivities();
            this.activityForm.reset();
          }
        },
        error: (err) => {
          console.error('Error adding activity', err);
          alert('Failed to add activity. Please try again.');
        }
      });
    
    this.subscriptions.push(sub);
  }

  editActivity(item: ItineraryItem): void {
    this.isEditing = true;
    this.editingItemId = item.id;
    this.activityForm.patchValue({
      time: item.time,
      activity: item.activity,
      location: item.location || '',
      notes: item.notes || ''
    });
  }

  updateActivity(): void {
    if (!this.trip || !this.editingItemId || this.activityForm.invalid) return;
    
    const itemIndex = this.trip.itinerary.findIndex(item => item.id === this.editingItemId);
    if (itemIndex === -1) return;
    
    const updatedItem: ItineraryItem = {
      ...this.trip.itinerary[itemIndex],
      ...this.activityForm.value
    };
    
    const sub = this.itineraryService.updateItineraryItem(updatedItem)
      .subscribe({
        next: (item) => {
          if (this.trip) {
            this.trip.itinerary[itemIndex] = item;
            this.loadDayActivities();
            this.cancelEdit();
          }
        },
        error: (err) => {
          console.error('Error updating activity', err);
          alert('Failed to update activity. Please try again.');
        }
      });
    
    this.subscriptions.push(sub);
  }

  deleteActivity(itemId: number): void {
    if (!this.trip) return;
    
    if (confirm('Are you sure you want to delete this activity?')) {
      const sub = this.itineraryService.deleteItineraryItem(itemId)
        .subscribe({
          next: () => {
            if (this.trip) {
              this.trip.itinerary = this.trip.itinerary.filter(item => item.id !== itemId);
              this.loadDayActivities();
            }
          },
          error: (err) => {
            console.error('Error deleting activity', err);
            alert('Failed to delete activity. Please try again.');
          }
        });
      
      this.subscriptions.push(sub);
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editingItemId = null;
    this.activityForm.reset();
  }

  toggleComplete(item: ItineraryItem): void {
    const updatedItem = { ...item, completed: !item.completed };
    
    const sub = this.itineraryService.updateItineraryItem(updatedItem)
      .subscribe({
        next: (updated) => {
          if (this.trip) {
            const index = this.trip.itinerary.findIndex(i => i.id === updated.id);
            if (index !== -1) {
              this.trip.itinerary[index] = updated;
              this.loadDayActivities();
            }
          }
        },
        error: (err) => {
          console.error('Error updating completion status', err);
        }
      });
    
    this.subscriptions.push(sub);
  }

  editTrip(): void {
    if (!this.trip) return;
    this.router.navigate(['/home/trips/edit', this.trip.id]);
  }

  goBack(): void {
    this.router.navigate(['/home/trips']);
  }
  
  getCompletedPercent(): number {
    if (!this.trip || this.trip.itinerary.length === 0) return 0;
    
    const completed = this.trip.itinerary.filter(item => item.completed).length;
    return Math.round((completed / this.trip.itinerary.length) * 100);
  }
  
  isDayBeforeToday(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  }
  
  isDayToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  }
  
  formatTime(timeStr: string): string {
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch (err) {
      return timeStr;
    }
  }
  // Add this method to the TripDetailComponent class
createPackingList(): void {
  if (!this.trip) return;
  
  // Navigate to the packing list generation page with trip details as query parameters
  this.router.navigate(['/home/generate'], {
    queryParams: {
      tripId: this.trip.id,
      destination: this.trip.destination,
      startDate: this.trip.startDate,
      endDate: this.trip.endDate
    }
  });
}
getCompletedActivities(): number {
  if (!this.trip || !this.trip.itinerary) return 0;
  
  return this.trip.itinerary.filter(item => item.completed).length;
}
}