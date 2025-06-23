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
  
  images: any = {};
  
  
  content: any = {};
  
  
  private subscriptions: Subscription[] = [];

  constructor(
    private connectService: ConnectService
  ) {}

  ngOnInit(): void {
    this.loadImages();
    this.loadContent();
  }
  
  ngAfterViewInit(): void {
    
    this.adjustForHeader();
  }
  
  ngOnDestroy(): void {
  
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
  
  
  handleImageError(event: any, tipNumber: number): void {
    console.warn(`Failed to load tip ${tipNumber} image`);
    event.target.style.display = 'none';
    this.images[`tip${tipNumber}`] = '';
  }

  
  adjustForHeader(): void {
    
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