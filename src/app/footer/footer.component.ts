import { Component, OnInit  } from '@angular/core';
import { ConnectService } from '../connect.service';
@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent implements OnInit{

  content: any = {};

  constructor(private connectService: ConnectService) {}

  ngOnInit(): void {
    this.connectService.getMainContent().subscribe({
      next: (res) => this.content = res,
      error: () => console.error('Failed to load footer content')
    });
  }

}
