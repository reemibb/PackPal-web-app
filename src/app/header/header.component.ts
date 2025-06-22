import { Component, OnInit  } from '@angular/core';
import { ConnectService } from '../connect.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  logoUrl: string = '';
  content: any = {};
  userName: string = '';

    constructor(
      private connectService: ConnectService,
      private router: Router
    ) {}

    ngOnInit(): void {
      this.connectService.getLogoUrl().subscribe({
        next: (res) => {
          console.log('Logo response:', res); 
          this.logoUrl = res.url;
        },
        error: () => console.error('Failed to load logo')
      });

      const userIdStr = localStorage.getItem('user_id');
      if (userIdStr) {
        const userId = Number(userIdStr);
        this.connectService.getUserName(userId).subscribe({
          next: res => this.userName = res.firstname,
          error: err => console.error('Failed to fetch user name', err)
        });
      }

  this.connectService.getMainContent().subscribe({
    next: (res) => this.content = res,
    error: () => console.error('Failed to load body content')
  });
}

onImageError(event: any): void {
  console.error('Image failed to load:', this.logoUrl);
}
  
logout(): void {
  
  localStorage.removeItem('user_id');
  localStorage.clear(); 

  
  this.router.navigate(['/login']);
}

}
