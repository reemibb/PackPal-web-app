import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ConnectService } from '../connect.service';
import { Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-tips',
  standalone: false,
  templateUrl: './tips.component.html',
  styleUrl: './tips.component.css'
})
export class TipsComponent implements OnInit, AfterViewInit, OnDestroy {
  // Default images
  images: any = {};
  
  // Default content
  content: any = {};
  
  // Track subscriptions to prevent memory leaks
  private subscriptions: Subscription[] = [];

  constructor(
    private connectService: ConnectService
  ) {}

  ngOnInit(): void {
    this.loadImages();
    this.loadContent();
  }
  
  ngAfterViewInit(): void {
    // Check if we need to scroll to accommodate the fixed header
    this.adjustForHeader();
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  loadImages(): void {
    const subscription = this.connectService.getTipsImages()
      .pipe(
        catchError(error => {
          console.error('Failed to load images:', error);
          return of({});
        })
      )
      .subscribe(res => {
        this.images = res;
      });
    
    this.subscriptions.push(subscription);
  }
  
  loadContent(): void {
    const subscription = this.connectService.getTipsContent()
      .pipe(
        catchError(error => {
          console.error('Failed to load content:', error);
          return of({});
        })
      )
      .subscribe(res => {
        this.content = res;
      });
    
    this.subscriptions.push(subscription);
  }
  
  // Handle image loading errors
  handleImageError(event: any, tipNumber: number): void {
    console.warn(`Failed to load tip ${tipNumber} image`);
    event.target.style.display = 'none';
    this.images[`tip${tipNumber}`] = '';
  }

  // Adjust scrolling if needed
  adjustForHeader(): void {
    // Check if URL has a hash indicating we should scroll
    if (window.location.hash === '#tips-top') {
      setTimeout(() => {
        const element = document.getElementById('tips-top');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }
}