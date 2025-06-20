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

  constructor(
    private connectService: ConnectService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
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
  }
}
