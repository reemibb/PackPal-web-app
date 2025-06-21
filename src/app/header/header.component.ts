import { Component, OnInit  } from '@angular/core';
import { ConnectService } from '../connect.service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  logoUrl: string = '';
  content: any = {};

    constructor(private connectService: ConnectService) {}

    ngOnInit(): void {
    this.connectService.getLogoUrl().subscribe({
    next: (res) => {
      console.log('Logo response:', res); // Add this line
      this.logoUrl = res.url;
    },
  error: () => console.error('Failed to load logo')
});

  this.connectService.getMainContent().subscribe({
    next: (res) => this.content = res,
    error: () => console.error('Failed to load body content')
  });
}

onImageError(event: any): void {
  console.error('Image failed to load:', this.logoUrl);
  // Optionally set a default image
  // this.logoUrl = 'assets/default-logo.png';
}
  

}
