import { Component, OnInit, HostListener } from '@angular/core';
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
  content: any = { title: 'Home' }; // Default title in case API fails
  userName: string = '';
  isScrolled: boolean = false;
  isMobileView: boolean = false;

  constructor(
    private connectService: ConnectService,
    private router: Router
  ) {
    this.checkScreenSize();
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobileView = window.innerWidth < 768;
  }

  ngOnInit(): void {
    this.loadLogo();
    this.loadUserInfo();
    this.loadContent();
  }

  loadLogo() {
    this.connectService.getLogoUrl().subscribe({
      next: (res) => {
        if (res && res.url) {
          this.logoUrl = res.url;
        }
      },
      error: (err) => {
        console.error('Failed to load logo', err);
        this.logoUrl = ''; // Clear URL on error to show placeholder
      }
    });
  }

  loadUserInfo() {
    const userIdStr = localStorage.getItem('user_id');
    if (userIdStr) {
      const userId = Number(userIdStr);
      this.connectService.getUserName(userId).subscribe({
        next: res => this.userName = res?.firstname || 'User',
        error: err => {
          console.error('Failed to fetch user name', err);
          this.userName = 'User'; // Fallback name
        }
      });
    }
  }

  loadContent() {
    this.connectService.getMainContent().subscribe({
      next: (res) => {
        if (res) {
          this.content = res;
        }
      },
      error: (err) => {
        console.error('Failed to load body content', err);
      }
    });
  }

  onImageError(event: any): void {
    console.error('Image failed to load:', this.logoUrl);
    this.logoUrl = ''; // Clear URL on error to show placeholder
    event.target.style.display = 'none'; // Hide the broken image
  }
  
  logout(): void {
    localStorage.removeItem('user_id');
    localStorage.clear(); 
    
    // Close the mobile nav if open
    const navbarCollapse = document.getElementById('navbarNav');
    if (navbarCollapse?.classList.contains('show')) {
      const navbarToggler = document.querySelector('.navbar-toggler') as HTMLElement;
      if (navbarToggler) navbarToggler.click();
    }
    
    this.router.navigate(['/login']);
  }
}