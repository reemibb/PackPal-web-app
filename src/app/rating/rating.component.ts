import { Component, OnInit } from '@angular/core';
import { ConnectService } from '../connect.service';

@Component({
  selector: 'app-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.css'],
  standalone: false
})
export class RatingComponent implements OnInit {
  stars = [1, 2, 3, 4, 5];
  selectedRating = 0;
  feedback = '';
  isSubmitting = false;
  ratingSubmitted = false;
  userId: number = 0;

  constructor(private connectService: ConnectService) {}

  ngOnInit() {
    const userIdStr = localStorage.getItem('user_id');
    this.userId = userIdStr ? Number(userIdStr) : 0;
    console.log('User ID from localStorage:', this.userId);
    
    if (this.userId <= 0) {
      console.warn('No valid user ID found. User might not be logged in.');
    }
  }

  selectRating(rating: number) {
    this.selectedRating = rating;
  }

  submitRating() {
    if (!this.selectedRating) return alert('Please select a rating.');

    this.isSubmitting = true;

    this.connectService.submitRating(this.userId, this.selectedRating, this.feedback)
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
  }
}