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


  constructor(
    private connectService: ConnectService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async ngOnInit() {
    // ✅ Only run AOS on the client side
    /*if (isPlatformBrowser(this.platformId)) {
      const AOS = require('aos');
      AOS.init();
    }*/

    // ✅ Load images
    this.connectService.getBodyImages().subscribe({
      next: res => this.images = res,
      error: () => console.error('Failed to load images')
    });
     this.connectService.getBodyContent().subscribe({
      next: res => this.content = res,
      error: () => console.error('Failed to load body content')
    });
    this.userId = Number(localStorage.getItem('user_id'));
  }
subscribe() {
  if (!this.email || !this.userId) return;

  this.connectService.subscribeUser(this.userId, this.email).subscribe(
    (res: any) => {
      if (res.success) {
        this.showAlert = true;
        setTimeout(() => this.showAlert = false, 5000); // Auto-dismiss after 5s
        this.email = ''; // Clear field
      } else {
        alert(res.message || "Subscription failed.");
      }
    },
    () => alert("Server error during subscription.")
  );
}

}
