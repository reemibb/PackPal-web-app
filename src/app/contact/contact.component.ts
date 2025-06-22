import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ConnectService } from '../connect.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-contact',
  standalone: false,
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent implements OnInit, OnDestroy {
  // Content
  content: any = {};
  userId: number = 0; 
  showAlert = false;
  isSubmitting = false; 
  toastMessage: string | null = null;
  toastType: 'success' | 'danger' = 'success';
  isMobile = false;
  
  // Map URL - directly sanitized
  mapUrl: SafeResourceUrl;
  
  // Form data
  formData = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };
  
  // For subscription management
  private subscriptions: Subscription[] = [];

  constructor(
    private connectService: ConnectService,
    private sanitizer: DomSanitizer
  ) {
    // Set default map URL
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://maps.google.com/maps?q=packpal&t=&z=13&ie=UTF8&iwloc=&output=embed'
    );
    this.checkScreenSize();
  }
  
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }
  
  checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  ngOnInit(): void {
    this.loadContent();
    
    // Get user ID from localStorage
    const userIdStr = localStorage.getItem('user_id');
    this.userId = userIdStr ? Number(userIdStr) : 0;
    
    if (this.userId <= 0) {
      console.warn('No valid user ID found. User might not be logged in.');
    }
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  loadContent(): void {
    const subscription = this.connectService.getContactContent().pipe(
      catchError(error => {
        console.error('Failed to load contact content:', error);
        return of({});
      })
    ).subscribe(res => {
      this.content = res || {};
      console.log('Contact content loaded:', this.content);
      
      // Update map URL if available
      if (this.content.mapUrl) {
        try {
          this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.content.mapUrl);
        } catch (e) {
          console.error('Invalid map URL:', e);
        }
      }
    });
    
    this.subscriptions.push(subscription);
  }

  submitMessage() {
    // Basic form validation
    if (!this.formData.name.trim() || !this.formData.email.trim() || 
        !this.formData.subject.trim() || !this.formData.message.trim()) {
      this.toastMessage = '';
      this.toastType = 'danger';
      setTimeout(() => this.toastMessage = null, 4000);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.formData.email)) {
      this.toastMessage = 'Please enter a valid email address.';
      this.toastType = 'danger';
      setTimeout(() => this.toastMessage = null, 4000);
      return;
    }

    // Start submission process
    this.isSubmitting = true;
    
    console.log('Submitting message with data:', {
      userId: this.userId,
      formData: this.formData
    });

    const subscription = this.connectService.sendMessage(
      this.userId, 
      this.formData.name, 
      this.formData.email, 
      this.formData.subject, 
      this.formData.message
    ).pipe(
      catchError(error => {
        console.error('HTTP Error sending message:', error);
        
        this.isSubmitting = false;
        this.toastMessage = 'Server error during sending.';
        this.toastType = 'danger';
        setTimeout(() => this.toastMessage = null, 4000);
        
        return of({ success: false });
      })
    ).subscribe((res: any) => {
      this.isSubmitting = false;
      
      if (res.success) {
        this.showAlert = true;
        setTimeout(() => this.showAlert = false, 5000);
        
        // Reset form
        this.formData = {
          name: '',
          email: '',
          subject: '',
          message: ''
        };
        
        this.toastMessage = 'Message sent successfully!';
        this.toastType = 'success';
        setTimeout(() => this.toastMessage = null, 4000);
      } else {
        this.toastMessage = 'Failed to send message: ' + (res.message || 'Unknown error');
        this.toastType = 'danger';
        setTimeout(() => this.toastMessage = null, 4000);
      }
    });
    
    this.subscriptions.push(subscription);
  }
}