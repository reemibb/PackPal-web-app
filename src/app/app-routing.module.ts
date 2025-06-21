import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { HomeComponent } from './home/home.component';
import { GenerateComponent } from './generate/generate.component';
import { TipsComponent } from './tips/tips.component';
import { ContactComponent } from './contact/contact.component';
import { BodyComponent } from './body/body.component';
import { RatingComponent } from './rating/rating.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {path: 'register', component: RegisterComponent},
  {
    path: 'home',
    component: HomeComponent, // layout wrapper with header/footer
    children: [
      { path: '', component: BodyComponent },           // default under /home
      { path: 'generate', component: GenerateComponent },
      { path: 'tips', component: TipsComponent },
      { path: 'contact', component: ContactComponent },
      { path: 'rating', component: RatingComponent }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
