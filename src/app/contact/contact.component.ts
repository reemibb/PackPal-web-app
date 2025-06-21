import { Component, OnInit } from '@angular/core';
import { ConnectService } from '../connect.service';

@Component({
  selector: 'app-contact',
  standalone: false,
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent implements OnInit {

  content: any = {};
  userId: number = 0; 
  showAlert = false;
  isSubmitting = false; // Add loading state
  toastMessage: string | null = null;

  formData = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  constructor(private connectService: ConnectService) {}

  ngOnInit(): void {
    // Remove duplicate call
    this.connectService.getContactContent().subscribe({
      next: res => {
        console.log('Contact content loaded:', res);
        this.content = res;
      },
      error: (error) => {
        console.error('Failed to load contact content:', error);
      }
    });

    // Get user ID from localStorage
    const userIdStr = localStorage.getItem('user_id');
    this.userId = userIdStr ? Number(userIdStr) : 0;
    console.log('User ID from localStorage:', this.userId);
    
    // Warn if no user ID (optional)
    if (this.userId <= 0) {
      console.warn('No valid user ID found. User might not be logged in.');
    }
  }

  submitMessage() {
    // Validate form data
    if (!this.formData.name.trim() || !this.formData.email.trim() || 
        !this.formData.subject.trim() || !this.formData.message.trim()) {
      this.toastMessage = '';
      setTimeout(() => this.toastMessage = null, 4000);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.formData.email)) {
      this.toastMessage = 'Please enter a valid email address.';
      setTimeout(() => this.toastMessage = null, 4000);
      return;
    }

    this.isSubmitting = true;
    
    console.log('Submitting message with data:', {
      userId: this.userId,
      formData: this.formData
    });

    this.connectService.sendMessage(
      this.userId, 
      this.formData.name, 
      this.formData.email, 
      this.formData.subject, 
      this.formData.message
    ).subscribe({
      next: (res: any) => {
        console.log('Message send response:', res);
        this.isSubmitting = false;
        
        if (res.success) {
          this.showAlert = true;
          setTimeout(() => this.showAlert = false, 5000);
          
          // Clear form
          this.formData = {
            name: '',
            email: '',
            subject: '',
            message: ''
          };
          
          this.toastMessage = 'Message sent successfully!';
          setTimeout(() => this.toastMessage = null, 4000);
        } else {
          this.toastMessage = 'Failed to send message: ' + (res.message || 'Unknown error');
          setTimeout(() => this.toastMessage = null, 4000);
        }
      },
      error: (error) => {
        console.error('HTTP Error sending message:', error);
        this.isSubmitting = false;
        
        let errorMessage = 'Server error during sending.';
        if (error.error && error.error.message) {
          errorMessage += ' Details: ' + error.error.message;
        }
        
        alert(errorMessage);
      }
    });
  }
}