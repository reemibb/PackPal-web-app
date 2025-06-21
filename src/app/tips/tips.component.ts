import { Component, OnInit } from '@angular/core';
import { ConnectService } from '../connect.service';

@Component({
  selector: 'app-tips',
  standalone: false,
  templateUrl: './tips.component.html',
  styleUrl: './tips.component.css'
})
export class TipsComponent implements OnInit {

  images: any = {};
  content: any = {};

  constructor(
    private connectService: ConnectService
  ) {}

  ngOnInit(): void {
    this.connectService.getTipsImages().subscribe({
      next: res => this.images = res,
      error: () => console.error('Failed to load images')
    });
     this.connectService.getTipsContent().subscribe({
      next: res => this.content = res,
      error: () => console.error('Failed to load body content')
    });
  }

  // Add any methods or properties needed for the tips component

}
