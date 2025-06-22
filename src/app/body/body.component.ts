import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ConnectService } from '../connect.service';

@Component({
  selector: 'app-body',
  standalone: false,
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.css']
})
export class BodyComponent implements OnInit {
  images: any = {};
  content: any = {};
  email: string = '';
  userId: number = 0; 
  showAlert = false;
  ratings: any[] = [];
  loadingRatings = true;
  hasError = false;
  errorMessage = '';

  constructor(
    private connectService: ConnectService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async ngOnInit() {
    this.connectService.getBodyImages().subscribe({
      next: res => this.images = res,
      error: () => console.error('Failed to load images')
    });
    
    this.connectService.getBodyContent().subscribe({
      next: res => this.content = res,
      error: () => console.error('Failed to load body content')
    });
    this.connectService.getRatings().subscribe({
      next: res => {
        this.ratings = res;
        console.log('Loaded ratings:', this.ratings);  
      },
      error: err => console.error('Failed to load ratings:', err)
    });
    
    this.loadingRatings = true;
    this.connectService.getRatings().subscribe({
      next: res => {
        console.log('Raw response from getRatings():', res);
        
        if (Array.isArray(res)) {
          this.ratings = res;
          console.log('Loaded ratings:', this.ratings);
        } else {
          console.error('Expected an array but got:', typeof res);
          this.hasError = true;
          this.errorMessage = 'Invalid response format';
          this.ratings = [];
        }
        
        this.loadingRatings = false;
      },
      error: err => {
        console.error('Failed to load ratings:', err);
        this.loadingRatings = false;
        this.hasError = true;
        this.errorMessage = 'Failed to load ratings';
      }
    });
    
    this.userId = Number(localStorage.getItem('user_id'));
  }
  
  subscribe() {
    if (!this.email || !this.userId) return;

    this.connectService.subscribeUser(this.userId, this.email).subscribe(
      (res: any) => {
        if (res.success) {
          this.showAlert = true;
          setTimeout(() => this.showAlert = false, 5000); 
          this.email = ''; 
        } else {
          alert(res.message || "Subscription failed.");
        }
      },
      () => alert("Server error during subscription.")
    );
  }
  
  generateStars(rating: number): string[] {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(i < rating ? 'filled' : 'empty');
    }
    return stars;
  }
}