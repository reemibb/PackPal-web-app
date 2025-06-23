import { Component, Inject, OnInit, OnDestroy, HostListener, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ConnectService } from '../connect.service';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-body',
  standalone: false,
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.css']
})
export class BodyComponent implements OnInit, OnDestroy {

  images: any = {
    pack: ''
  };
  content: any = {
    title: 'Welcome to Our Platform',
    subtitle: 'Your journey begins here',
    alert: 'Welcome to our service!',
    whyHeader: 'Why Choose Us',
    whySub: 'Discover the benefits of our service',
    whyHeader1: 'Feature 1',
    whySub1: 'Description of feature 1',
    whyHeader2: 'Feature 2',
    whySub2: 'Description of feature 2',
    whyHeader3: 'Feature 3',
    whySub3: 'Description of feature 3',
    howHeader: 'How It Works',
    howSub1: 'Step 1',
    howSub2: 'Step 2',
    howSub3: 'Step 3',
    howSub4: 'Step 4',
    tipHeader: 'Subscribe to Our Newsletter',
    subscribe: 'Get travel tips delivered to your inbox'
  };
  
  email: string = '';
  userId: number = 0;
  showAlert = false;
  ratings: any[] = [];
  loadingRatings = true;
  hasError = false;
  errorMessage = '';
  innerWidth: number = 0;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private connectService: ConnectService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.innerWidth = window.innerWidth;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (isPlatformBrowser(this.platformId)) {
      this.innerWidth = window.innerWidth;
    }
  }

  ngOnInit() {
    this.loadInitialData();
    if (isPlatformBrowser(this.platformId)) {
      this.userId = Number(localStorage.getItem('user_id') || '0');
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadInitialData() {

    this.loadingRatings = true;
    
    const imagesSub = this.connectService.getBodyImages().pipe(
      catchError(error => {
        console.error('Failed to load images:', error);
        return of(this.images); 
      })
    ).subscribe(res => {
      if (res && Object.keys(res).length > 0) {
        this.images = res;
      }
    });
    
    
    const contentSub = this.connectService.getBodyContent().pipe(
      catchError(error => {
        console.error('Failed to load body content:', error);
        return of(this.content); 
      })
    ).subscribe(res => {
      if (res && Object.keys(res).length > 0) {
        
        this.content = { ...this.content, ...res };
      }
    });
    
    const ratingsSub = this.connectService.getRatings().pipe(
      catchError(error => {
        console.error('Failed to load ratings:', error);
        this.hasError = true;
        this.errorMessage = 'Failed to load ratings';
        return of([]);
      }),
      finalize(() => {
        this.loadingRatings = false;
      })
    ).subscribe(res => {
      if (Array.isArray(res)) {
        this.ratings = res;
      } else {
        console.error('Expected an array but got:', typeof res);
        this.hasError = true;
        this.errorMessage = 'Invalid response format';
        this.ratings = [];
      }
    });
    
 
    this.subscriptions.push(imagesSub, contentSub, ratingsSub);
  }
  
  subscribe() {
    if (!this.email || !this.userId) {
      return;
    }

    const subscription = this.connectService.subscribeUser(this.userId, this.email).pipe(
      catchError(error => {
        console.error('Subscription error:', error);
      
        alert("Server error during subscription. Please try again later.");
        return of({ success: false, message: "Server error" });
      })
    ).subscribe((res: any) => {
      if (res.success) {
        this.showAlert = true;
     
        this.email = '';
    
        setTimeout(() => this.showAlert = false, 5000);
      } else {
        alert(res.message || "Subscription failed. Please try again.");
      }
    });

    this.subscriptions.push(subscription);
  }
  
  generateStars(rating: number): string[] {
 
    const safeRating = !isNaN(rating) ? Math.min(Math.max(rating, 0), 5) : 0;
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(i < safeRating ? 'filled' : 'empty');
    }
    return stars;
  }
}