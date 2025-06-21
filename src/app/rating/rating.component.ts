import { Component } from '@angular/core';

@Component({
  selector: 'app-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.css'],
  standalone: false
})
export class RatingComponent {
  stars = [1, 2, 3, 4, 5];
  selectedRating = 0;
  feedback = '';
  isSubmitting = false;
  ratingSubmitted = false;

  selectRating(rating: number) {
    this.selectedRating = rating;
  }

  submitRating() {
    if (!this.selectedRating) return alert('Please select a rating.');

    this.isSubmitting = true;

    // Simulate HTTP request
    setTimeout(() => {
      console.log('Rating submitted:', {
        rating: this.selectedRating,
        feedback: this.feedback
      });
      this.isSubmitting = false;
      this.ratingSubmitted = true;

      // Reset form (optional)
      this.selectedRating = 0;
      this.feedback = '';
    }, 1000);
  }
}
