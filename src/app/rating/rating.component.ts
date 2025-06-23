import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ConnectService } from '../connect.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.css'],
  standalone: false
})
export class RatingComponent implements OnInit, OnDestroy {
  stars = [1, 2, 3, 4, 5];
  selectedRating = 0;
  feedback = '';
  isSubmitting = false;
  ratingSubmitted = false;
  userId: number = 0;
  viewportHeight: number = 0;
  viewportWidth: number = 0;
  
  private subscriptions: Subscription[] = [];

  constructor(private connectService: ConnectService) {
    this.updateViewportDimensions();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.updateViewportDimensions();
  }
  
  updateViewportDimensions() {
    this.viewportHeight = window.innerHeight;
    this.viewportWidth = window.innerWidth;
  }

  ngOnInit() {
    const userIdStr = localStorage.getItem('user_id');
    this.userId = userIdStr ? Number(userIdStr) : 0;
    
    if (this.userId <= 0) {
      console.warn('No valid user ID found. User might not be logged in.');
    }
  }
  
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  selectRating(rating: number) {
    this.selectedRating = rating;
  }

  submitRating() {
    if (!this.selectedRating) {
      alert('Please select a rating.');
      return;
    }

    this.isSubmitting = true;

    const subscription = this.connectService.submitRating(this.userId, this.selectedRating, this.feedback)
      .subscribe({
        next: (response) => {
          console.log('Rating submitted successfully:', response);
          this.isSubmitting = false;
          this.ratingSubmitted = true;
          
          
          this.selectedRating = 0;
          this.feedback = '';
        },
        error: (error) => {
          console.error('Error submitting rating:', error);
          this.isSubmitting = false;
          alert('Failed to submit rating. Please try again.');
        }
      });
    
    this.subscriptions.push(subscription);
  }
}