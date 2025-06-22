import { Component } from '@angular/core';
import { ConnectService } from '../connect.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: false
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  message: string = '';
  logoUrl: string = '';

  constructor(private connectService: ConnectService, private router: Router) {}

  login() {
    const data = { email: this.email, password: this.password };

    this.connectService.login(data).subscribe(response => {
      if (response.success) {
        this.message = 'Login successful! Redirecting...';
        localStorage.setItem('user_id', response.user.id);
        this.router.navigate(['/home']);  
      } else {
        this.message = response.message || 'Login failed.';
      }
    }, error => {
      this.message = 'Server error occurred.';
    });
  }

  ngOnInit() {
  this.connectService.getLogoUrl().subscribe(res => {
    if (res?.url) {
        this.logoUrl = res.url;
      }
  });
}
}
