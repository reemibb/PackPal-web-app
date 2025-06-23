import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConnectService } from '../connect.service';
import { Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent implements OnInit, OnDestroy {

  content: any = {
    title: 'Company Name',
    rights: '© 2025 All Rights Reserved'
  };
  
  bodycontent: any = {
    subtitle: 'Your trusted partner for innovative solutions.'
  };
  
  contactcontent: any = {
    address: '123 Main Street, City, Country',
    email: 'info@example.com',
    phone: '+123 456 789'
  };


  private subscriptions: Subscription[] = [];

  constructor(private connectService: ConnectService) {}

  ngOnInit(): void {
    this.loadMainContent();
    this.loadBodyContent();
    this.loadContactContent();
  }

  ngOnDestroy(): void {
   
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadMainContent(): void {
    const subscription = this.connectService.getMainContent()
      .pipe(
        catchError(error => {
          console.error('Failed to load main content:', error);
          return of(this.content);
        })
      )
      .subscribe(res => {
        if (res && Object.keys(res).length > 0) {
          this.content = {...this.content, ...res};
        }
      });
    
    this.subscriptions.push(subscription);
  }

  loadBodyContent(): void {
    const subscription = this.connectService.getBodyContent()
      .pipe(
        catchError(error => {
          console.error('Failed to load body content:', error);
          return of(this.bodycontent); 
        })
      )
      .subscribe(res => {
        if (res && Object.keys(res).length > 0) {
          this.bodycontent = {...this.bodycontent, ...res};
        }
      });
    
    this.subscriptions.push(subscription);
  }

  loadContactContent(): void {
    const subscription = this.connectService.getContactContent()
      .pipe(
        catchError(error => {
          console.error('Failed to load contact content:', error);
          return of(this.contactcontent);
        })
      )
      .subscribe(res => {
        if (res && Object.keys(res).length > 0) {
          this.contactcontent = {...this.contactcontent, ...res};
        }
      });
    
    this.subscriptions.push(subscription);
  }
}