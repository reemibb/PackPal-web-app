import { Component, OnInit, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { ConnectService } from '../connect.service';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';


declare var bootstrap: any;

@Component({
  selector: 'app-generate',
  templateUrl: './generate.component.html',
  styleUrls: ['./generate.component.css'],
  standalone: false,
})
export class GenerateComponent implements OnInit, AfterViewInit, OnDestroy {

  content = {
    title: 'Generate Your Packing List',
    types: [] as string[],
    activities: [] as string[],
    packs: [] as string[]
  };

  selectedTripType: string = '';
  selectedActivities: { [key: string]: boolean } = {};
  selectedPack: string = '';
  packingList: string[] = [];
  startDate: string = '';
  endDate: string = '';

  
  countries: string[] = [];
  selectedCountry: string = '';
  includeWeather: boolean = false;
  weatherInfo: any = null;
  weatherLoading: boolean = false;

 
  modalInstance: any;
  newItem: string = '';
  screenWidth: number = window.innerWidth;
  private destroy$ = new Subject<void>();
  private inputChange$ = new Subject<string>();
  private subscriptions: Subscription[] = [];

 
  checklistItems: string[] = [];
  packedMap: { [item: string]: boolean } = {};
  lastPackingListId: number = 0;

 
  alertMessage: string = '';
  alertType: 'success' | 'danger' | 'warning' | '' = '';
  

  debugMode: boolean = true;

  constructor(private connectService: ConnectService, private http: HttpClient, private route: ActivatedRoute) {
    
    this.inputChange$
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        this.newItem = value;
      });
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.screenWidth = window.innerWidth;
  }

  ngOnInit() {
    this.loadGenerateContent();
    this.loadCountries();
    this.fetchUserPackingList();
    
 
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    this.startDate = this.formatDate(today);
    this.endDate = this.formatDate(tomorrow);

    this.route.queryParams.subscribe(params => {
    if (params['tripId']) {
      // We have trip data, let's pre-fill the form
      this.selectedCountry = params['destination'] || '';
      this.startDate = params['startDate'] || this.startDate;
      this.endDate = params['endDate'] || this.endDate;
      
      // You might want to automatically select some options based on the destination
      this.preSelectOptionsBasedOnDestination(params['destination']);
    }
  });
  }
  
  ngAfterViewInit() {
    this.initializeModal();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
  
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  mapActivityName(activity: string): string {
    return activity.replace(/[\u{1F300}-\u{1F6FF}]/gu, '').trim();
  }

  preSelectOptionsBasedOnDestination(destination: string): void {
  if (!destination) return;
  
  // This is a simple example - you might want to implement more sophisticated logic
  const lowercaseDest = destination.toLowerCase();
  
  // Select trip type based on destination keywords
  if (lowercaseDest.includes('beach') || lowercaseDest.includes('island') || 
      lowercaseDest.includes('coast') || lowercaseDest.includes('sea')) {
    this.selectedTripType = 'Beach Vacation';
  } else if (lowercaseDest.includes('mountain') || lowercaseDest.includes('hiking') || 
             lowercaseDest.includes('alps') || lowercaseDest.includes('trek')) {
    this.selectedTripType = 'Mountain Trip';
  } else if (lowercaseDest.includes('city') || lowercaseDest.includes('urban')) {
    this.selectedTripType = 'City Exploration';
  }
  
  // You can also pre-select activities based on destination
  // Just make sure these values exist in your content.activities array
  if (lowercaseDest.includes('beach')) {
    this.selectedActivities['Swimming'] = true;
    this.selectedActivities['Sunbathing'] = true;
  } else if (lowercaseDest.includes('mountain')) {
    this.selectedActivities['Hiking'] = true;
    this.selectedActivities['Photography'] = true;
  }
}
  
  getSelectedActivities(): string {
    return Object.keys(this.selectedActivities)
      .filter(activity => this.selectedActivities[activity])
      .join(', ');
  }
  
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  getPackedCount(): number {
    return Object.values(this.packedMap).filter(Boolean).length;
  }
  
  loadGenerateContent() {
    const subscription = this.connectService.getGenerateContent().subscribe({
      next: res => {
        if (res && res.success) {
          this.content = res.data || this.content;
        } else {
          console.error('Failed to load generate content');
          
          this.content = {
            title: 'Generate Your Packing List',
            types: ['Business', 'Leisure', 'Adventure'],
            activities: ['Beach', 'Hiking', 'Photography', 'Sightseeing'],
            packs: ['Light', 'Medium', 'Heavy']
          };
        }
      },
      error: err => {
        console.error('Error loading generate content:', err);
      }
    });
    this.subscriptions.push(subscription);
  }
  
  loadCountries() {
    const subscription = this.http.get<any>('http://localhost/final-asp-php/get_countries.php').subscribe({
      next: res => {
        if (res && res.success) {
          this.countries = res.data || [];
        } else {
          console.error('Failed to load countries');
          
          this.countries = ['USA', 'Canada', 'UK', 'France', 'Germany', 'Japan', 'Australia'];
        }
      },
      error: err => {
        console.error('HTTP error when fetching countries:', err);
      }
    });
    this.subscriptions.push(subscription);
  }
  
  fetchUserPackingList() {
  const user_id = localStorage.getItem('user_id');
  if (!user_id) {
    console.log('No user ID found, skipping packing list fetch');
    return;
  }

  const url = `http://localhost/final-asp-php/get_packing_list.php?user_id=${user_id}`;
  const subscription = this.http.get<any>(url).subscribe({
    next: (res) => {
      if (res && res.success && Array.isArray(res.items)) {
        
        this.lastPackingListId = res.packing_list_id || 0;
        
        this.checklistItems = res.items;

        
        this.resetPackedStatus();
        
        
        if (res.packed_status) {
          Object.keys(res.packed_status).forEach((item) => {
            
            if (this.checklistItems.includes(item)) {
              this.packedMap[item] = res.packed_status[item] ?? false;
            }
          });
        }
        
        console.log('Loaded packing list with ID:', this.lastPackingListId, 'and', this.checklistItems.length, 'items');
      } else {
        console.warn('No packing list data available');
        this.checklistItems = [];
        this.packedMap = {};
      }
    },
    error: (err) => {
      console.error('Failed to fetch packing list:', err);
      this.showAlert('Unable to load your saved checklist', 'warning');
    }
  });
  this.subscriptions.push(subscription);
}
  
  initializeModal() {
    const modalElement = document.getElementById('generationModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement, {
        backdrop: 'static',
        keyboard: false
      });
    }
  }
  
  
  onToggleWeather() {
    if (this.includeWeather && this.selectedCountry) {
      this.fetchWeather(this.selectedCountry);
    } else {
      this.weatherInfo = null;
    }
  }

  fetchWeather(country: string) {
    this.weatherLoading = true;
    const apiKey = '87f6122d912722c8b872e1df7db844bc';
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(country)}&appid=${apiKey}&units=metric`;

    const subscription = this.http.get(apiUrl).subscribe({
      next: data => {
        this.weatherInfo = data;
        this.weatherLoading = false;
      },
      error: err => {
        console.error('Failed to fetch weather:', err);
        this.weatherLoading = false;
        this.showAlert('Could not fetch weather information', 'warning');
      }
    });
    this.subscriptions.push(subscription);
  }

  generatePackingList() {
    if (!this.validateInputs()) {
      this.showAlert('Please fill in all required fields', 'warning');
      return;
    }
    
    this.packingList = [];
    
    const packPref = this.selectedPack.toLowerCase();
    
    console.log('Trip Type:', this.selectedTripType);
    console.log('Activities Object:', this.selectedActivities);
    console.log('Selected Activities:', Object.keys(this.selectedActivities).filter(k => this.selectedActivities[k] === true));
    console.log('Pack Preference:', packPref);
    
    const selectedActivitiesList = Object.keys(this.selectedActivities)
      .filter(activity => this.selectedActivities[activity] === true);
    
    console.log('Selected Activities List:', selectedActivitiesList);
    
    const essentialItems = [
      '🪥 Toothbrush & Toothpaste',
      '🧴 Shampoo & Conditioner',
      '💊 Personal Medications',
      '🔌 Phone Charger',
      '💳 ID/Passport',
      '💵 Cash/Credit Cards',
      '🧦 Socks & Underwear'
    ];
    
    this.packingList.push(...essentialItems);
    
    if (this.selectedTripType === 'Business') {
      this.packingList.push(
        '👔 Formal Shirts/Blouses', 
        '👖 Formal Pants/Skirts', 
        '👞 Dress Shoes'
      );
      
      if (packPref === 'medium' || packPref === 'heavy') {
        this.packingList.push(
          '💼 Laptop & Charger', 
          '📄 Business Documents/Portfolio',
          '🖊️ Pens & Notebook'
        );
      }
      
      if (packPref === 'heavy') {
        this.packingList.push(
          '👔 Ties/Scarves',
          '⌚ Professional Watch',
          '💳 Business Cards'
        );
      }
    } 
    else if (this.selectedTripType === 'Leisure') {
      this.packingList.push(
        '👕 Casual T-shirts',
        '👖 Jeans/Casual Pants',
        '👟 Comfortable Walking Shoes'
      );
      
      if (packPref === 'medium' || packPref === 'heavy') {
        this.packingList.push(
          '📱 Phone & Charger',
          '📚 Books/E-reader'
        );
      }
      
      if (packPref === 'heavy') {
        this.packingList.push(
          '🎧 Headphones',
          '👓 Sunglasses',
          '🧴 Moisturizer'
        );
      }
    } 
    else if (this.selectedTripType === 'Adventure') {
      this.packingList.push(
        '🥾 Hiking Boots/Trail Shoes',
        '🧥 Weather-appropriate Jacket',
        '👖 Quick-dry Pants/Shorts'
      );
      
      if (packPref === 'medium' || packPref === 'heavy') {
        this.packingList.push(
          '👕 Moisture-wicking Shirts',
          '🧦 Hiking Socks',
          '🎒 Backpack'
        );
      }
      
      if (packPref === 'heavy') {
        this.packingList.push(
          '🧭 Compass/GPS Device',
          '🔦 Flashlight/Headlamp',
          '🧪 Water Purification',
          '🔋 Portable Charger'
        );
      }
    }
    
    for (const activity of selectedActivitiesList) {
      console.log(`Processing activity: ${activity}`);
      
      const activityName = this.mapActivityName(activity);
      console.log(`Mapped activity name: ${activityName}`);
      
      if (activityName === 'Swimming') {
        console.log('Adding Swimming items');
        
        this.packingList.push(
          '🏊 Swimsuit/Swimming trunks',
          '🧴 Waterproof Sunscreen',
          '👓 Swim Goggles',
          '🧢 Swimming Cap'
        );
        
        if (packPref === 'medium' || packPref === 'heavy') {
          this.packingList.push(
            '🏄 Beach/Pool Towel',
            '👕 Cover-up/T-shirt',
            '👟 Waterproof Sandals'
          );
        }
        
        if (packPref === 'heavy') {
          this.packingList.push(
            '🏊 Ear Plugs',
            '👟 Flip Flops',
            '🧪 After-sun Lotion'
          );
        }
      }
      
      else if (activityName === 'Beach') {
        console.log('Adding Beach items');
        
        this.packingList.push(
          '🏖️ Swimwear',
          '🧴 Sunscreen (SPF 30+)',
          '👓 Sunglasses'
        );
        
        if (packPref === 'medium' || packPref === 'heavy') {
          this.packingList.push(
            '🧢 Sun Hat',
            '👙 Extra Swimsuit',
            '🏄 Beach Towel'
          );
        }
        
        if (packPref === 'heavy') {
          this.packingList.push(
            '👡 Flip-flops/Sandals',
            '📖 Beach Reading Material',
            '💧 Insulated Water Bottle'
          );
        }
      }
      
      else if (activityName === 'Hiking') {
        console.log('Adding Hiking items');
        
        this.packingList.push(
          '🥾 Hiking Boots',
          '🧦 Hiking Socks',
          '🧢 Sun Hat/Cap'
        );
        
        if (packPref === 'medium' || packPref === 'heavy') {
          this.packingList.push(
            '🧴 Sunscreen',
            '🦟 Insect Repellent',
            '🥤 Reusable Water Bottle',
            '🥪 Trail Snacks'
          );
        }
        
        if (packPref === 'heavy') {
          this.packingList.push(
            '🗺️ Trail Maps',
            '🔦 Flashlight/Headlamp',
            '🧰 First Aid Kit',
            '🧥 Rain Jacket'
          );
        }
      }
      
      else if (activityName === 'Photography') {
        console.log('Adding Photography items');
        
        this.packingList.push(
          '📷 Camera',
          '🔋 Extra Camera Batteries',
          '💾 Memory Cards'
        );
        
        if (packPref === 'medium' || packPref === 'heavy') {
          this.packingList.push(
            '🔍 Camera Lenses',
            '🧹 Lens Cleaning Kit',
            '🔌 Battery Charger'
          );
        }
        
        if (packPref === 'heavy') {
          this.packingList.push(
            '🦮 Tripod',
            '💼 Camera Bag/Case',
            '☔ Camera Rain Cover',
            '💻 Laptop for Photo Editing'
          );
        }
      }
      
      else if (activityName === 'Sightseeing') {
        console.log('Adding Sightseeing items');
        
        this.packingList.push(
          '👟 Comfortable Walking Shoes',
          '🎒 Day Backpack',
          '🗺️ City Maps/Guidebook'
        );
        
        if (packPref === 'medium' || packPref === 'heavy') {
          this.packingList.push(
            '📱 Translation App/Phrasebook',
            '🔭 Binoculars',
            '💳 Museum/Attraction Passes'
          );
        }
        
        if (packPref === 'heavy') {
          this.packingList.push(
            '💵 Local Currency',
            '📸 Camera/Phone for Photos',
            '🧴 Sunscreen',
            '🧢 Hat for Sun Protection'
          );
        }
      }
      
      else {
        console.log(`No exact match for "${activityName}", checking partial matches`);
      
        if (activityName.includes('Ski') || activityName.includes('Snow') || activityName.includes('Winter')) {
          this.packingList.push(
            '🧥 Ski Jacket/Snow Gear',
            '👖 Snow Pants',
            '🧤 Insulated Gloves',
            '🧣 Thermal Scarf',
            '👓 Ski Goggles'
          );
        }
        
        if (activityName.includes('Camp')) {
          this.packingList.push(
            '🏕️ Tent',
            '🛏️ Sleeping Bag',
            '🔦 Flashlight/Headlamp',
            '🧰 Multi-tool',
            '🔥 Fire Starter'
          );
        }
        
    
        if (activityName.includes('Meeting') || activityName.includes('Conference')) {
          this.packingList.push(
            '👔 Formal Attire',
            '💼 Business Cards',
            '📝 Notebook & Pen',
            '💻 Laptop & Charger',
            '🖨️ Presentation Materials'
          );
        }
      }
    }
    
    if (packPref === 'light') {
      this.packingList.push(
        '🧼 Travel-sized Toiletries',
        '🧺 Travel Laundry Soap'
      );
    } else if (packPref === 'medium') {
      this.packingList.push(
        '👚 Extra Change of Clothes',
        '🧸 Travel Pillow',
        '👃 Deodorant',
        '🦷 Dental Floss'
      );
    } else if (packPref === 'heavy') {
      this.packingList.push(
        '🧳 Extra Luggage',
        '👕 Extra Clothing Options',
        '🔌 Multi-adapter',
        '🧴 Full-sized Toiletries',
        '🧻 Extra Personal Items',
        '🧪 Stain Remover',
        '🧢 Multiple Hats/Accessories'
      );
    }
    
  
    if (this.includeWeather && this.weatherInfo) {
      const temp = this.weatherInfo.main.temp;
      const weatherDesc = this.weatherInfo.weather[0].description.toLowerCase();
      
  
      if (temp < 5) {
        this.packingList.push(
          '🧥 Heavy Winter Coat',
          '🧣 Scarf',
          '🧤 Gloves',
          '👢 Winter Boots',
          '🧦 Thermal Socks',
          '👖 Thermal Underwear'
        );
      } else if (temp < 15) {
        this.packingList.push(
          '🧥 Light Jacket/Coat',
          '🧣 Light Scarf',
          '🧤 Light Gloves',
          '👕 Long Sleeve Shirts'
        );
      } else if (temp > 28) {
        this.packingList.push(
          '👕 Breathable T-shirts',
          '👖 Shorts/Light Pants',
          '👓 Sunglasses',
          '🧴 High SPF Sunscreen',
          '💧 Water Bottle',
          '🧢 Sun Hat'
        );
      }
      
      
      if (weatherDesc.includes('rain') || weatherDesc.includes('drizzle')) {
        this.packingList.push(
          '☔ Umbrella',
          '🧥 Waterproof Jacket',
          '👞 Waterproof Shoes',
          '👜 Waterproof Bag Cover'
        );
      } else if (weatherDesc.includes('snow')) {
        this.packingList.push(
          '👢 Snow Boots',
          '☃️ Winter Hat',
          '👖 Snow Pants',
          '👓 Snow Goggles'
        );
      } else if (weatherDesc.includes('fog') || weatherDesc.includes('mist')) {
        this.packingList.push(
          '📱 Offline Maps',
          '🔦 Flashlight'
        );
      }
    }
    
     
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      const tripDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
      
      if (tripDays > 4) {
        this.packingList.push(
          '🧺 Travel Laundry Soap',
          '👚 Additional Clothing Sets'
        );
      }
      if (tripDays > 7) {
        this.packingList.push(
          '🩹 Extended Medical Supplies',
          '💊 Extra Medication'
        );
      }
    }
    
    
    this.packingList = [...new Set(this.packingList)];
    console.log('Final packing list has', this.packingList.length, 'items');
    
    
    if (this.modalInstance) this.modalInstance.show();
  }

  validateInputs(): boolean {
    return Boolean(
      this.selectedCountry &&
      this.startDate &&
      this.endDate &&
      this.selectedTripType &&
      this.selectedPack
    );
  }
  
  
  closeModal() {
    if (this.modalInstance) this.modalInstance.hide();
  }
  
  addCustomItem() {
    const trimmedItem = this.newItem.trim();
    if (trimmedItem && !this.packingList.includes(trimmedItem)) {
      this.packingList.push(trimmedItem);
      this.newItem = '';
    }
  }
  
  removeItem(item: string) {
    this.packingList = this.packingList.filter(i => i !== item);
  }
  

  showAlert(message: string, type: 'success' | 'danger' | 'warning') {
    this.alertMessage = message;
    this.alertType = type;
    
    
    setTimeout(() => {
      if (this.alertMessage === message) {
        this.closeAlert();
      }
    }, 5000);
  }
  
  closeAlert() {
    this.alertMessage = '';
    this.alertType = '';
  }
  
  onChecklistChange(item: string, checked: boolean) {
  
  if (!this.checklistItems.includes(item)) {
    console.warn(`Attempted to update item "${item}" that is not in the current list`);
    return;
  }
  
  this.packedMap[item] = checked;

  const user_id = localStorage.getItem('user_id');
  if (!user_id || !this.lastPackingListId) {
    console.warn('Missing user_id or packing_list_id');
    return;
  }

  const payload = [{
    user_id: Number(user_id),
    item_name: item,
    is_checked: checked,
    packing_list_id: this.lastPackingListId
  }];

  this.http.post('http://localhost/final-asp-php/save_checklist.php', payload).subscribe({
    next: (response: any) => {
      if (response.success) {
        console.log(`Item "${item}" updated successfully for list ${this.lastPackingListId}.`);
      } else {
        console.warn(`Failed to update "${item}": ${response.message}`);
      }
    },
    error: err => {
      console.error(`Network error saving "${item}":`, err);
    }
  });
}
  
  saveChecklistProgress() {
    const user_id = localStorage.getItem('user_id');
    
    if (!user_id || !this.checklistItems.length) {
      this.showAlert('No items to save', 'warning');
      return;
    }

    if (!this.lastPackingListId || this.lastPackingListId <= 0) {
      this.showAlert('No packing list found. Please generate a list first.', 'warning');
      return;
    }

    const payload = this.checklistItems.map(item => ({
      user_id: Number(user_id),
      item_name: item,
      is_checked: this.packedMap[item] || false,
      packing_list_id: this.lastPackingListId
    }));

    const subscription = this.http.post('http://localhost/final-asp-php/save_checklist.php', payload).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.showAlert('Progress saved successfully!', 'success');
        } else {
          this.showAlert('Failed to save: ' + (response.message || 'Unknown error'), 'danger');
        }
      },
      error: (err) => {
        console.error('Error saving checklist progress:', err);
        this.showAlert('Failed to save progress: ' + (err.message || 'Network error'), 'danger');
      }
    });
    
    this.subscriptions.push(subscription);
  }
  
  saveAndExport() {
  if (this.packingList.length === 0) {
    this.showAlert('No items to save', 'warning');
    return;
  }
  
  
  this.packingList = this.packingList.filter(item => !!item && item.trim() !== '');
  
  const user_id = localStorage.getItem('user_id');
  if (!user_id) {
    this.showAlert('User not logged in', 'danger');
    return;
  }

  const payload = {
    user_id: Number(user_id),
    destination: this.selectedCountry,
    start_date: this.startDate, 
    end_date: this.endDate,     
    trip_type: this.selectedTripType,
    activities: Object.keys(this.selectedActivities).filter(k => this.selectedActivities[k]),
    packing_pref: this.selectedPack,
    weather: this.includeWeather ? this.weatherInfo : null,
    items: this.packingList
  };

  const subscription = this.http.post('http://localhost/final-asp-php/save_packing_list.php', payload).subscribe({
    next: (res: any) => {
      if (res && res.success) {
        this.closeModal();
        this.showAlert('List saved successfully!', 'success');
        
        
        this.checklistItems = [...this.packingList]; 
        this.lastPackingListId = res.packing_list_id || this.lastPackingListId;
        
        
        this.resetPackedStatus();
        
      
        setTimeout(() => {
          this.exportAsPDF();
        }, 500);
      } else {
        this.showAlert('Failed to save: ' + (res.message || 'Unknown error'), 'danger');
      }
    },
    error: (error) => {
      console.error('Save error:', error);
      this.showAlert('Failed to save packing list', 'danger');
    }
  });
  
  this.subscriptions.push(subscription);
}


resetPackedStatus() {
  
  const newPackedMap: { [item: string]: boolean } = {};
  
  
  this.checklistItems.forEach(item => {
    newPackedMap[item] = false;
  });
  
  
  this.packedMap = newPackedMap;
  
  console.log('Packed status reset for new list with', this.checklistItems.length, 'items');
}
  
  exportAsPDF() {
    
    const tempDiv = document.createElement('div');
    tempDiv.style.padding = '20px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.color = 'black';
    tempDiv.style.maxWidth = '800px';
    tempDiv.style.margin = '0 auto';
    
    
    let htmlContent = `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #14532d; padding-bottom: 15px;">
        <h1 style="color: #14532d; margin-bottom: 10px; font-size: 28px;">Packing List for ${this.selectedCountry}</h1>
        <div style="color: #444; font-size: 14px; margin: 5px 0;">
          <span style="margin-right: 15px;"><strong>From:</strong> ${this.formatDateDisplay(this.startDate)}</span>
          <span><strong>To:</strong> ${this.formatDateDisplay(this.endDate)}</span>
        </div>
        <div style="color: #444; font-size: 14px; margin-top: 5px;">
          <span><strong>Trip Type:</strong> ${this.selectedTripType}</span>
        </div>
      </div>
    `;

    
    if (this.weatherInfo) {
      htmlContent += `
        <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2196f3;">
          <h3 style="color: #0d47a1; margin-bottom: 10px; font-size: 18px;">🌤️ Weather in ${this.selectedCountry}</h3>
          <div style="display: flex; flex-wrap: wrap;">
            <div style="margin-right: 30px;">
              <span style="font-weight: bold;">Temperature:</span> ${this.weatherInfo.main.temp}°C
            </div>
            <div>
              <span style="font-weight: bold;">Condition:</span> ${this.weatherInfo.weather[0].description}
            </div>
          </div>
        </div>
      `;
    }

    
    htmlContent += `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #14532d; margin-bottom: 15px; font-size: 18px;">📦 Your Packing Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #e9f5e9;">
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ccc;">Item</th>
              <th style="padding: 10px; text-align: center; border-bottom: 1px solid #ccc; width: 80px;">Status</th>
            </tr>
          </thead>
          <tbody>
    `;

    this.packingList.forEach((item, index) => {
      const bgColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9';
      htmlContent += `
        <tr style="background-color: ${bgColor};">
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">
            <div style="width: 16px; height: 16px; border: 1px solid #ccc; display: inline-block;"></div>
          </td>
        </tr>
      `;
    });

    htmlContent += `
          </tbody>
        </table>
      </div>
      <div style="text-align: center; margin-top: 30px; color: #777; font-size: 12px;">
        Generated on ${new Date().toLocaleDateString()} by PackPal
      </div>
    `;

    tempDiv.innerHTML = htmlContent;
    document.body.appendChild(tempDiv);

    
    const opt = {
      margin: 10,
      filename: `PackingList-${this.selectedCountry}-${this.formatDate(new Date())}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

     
  // @ts-ignore
    import('html2pdf.js').then((html2pdf: any) => {
      html2pdf.default().set(opt).from(tempDiv).save().then(() => {
        document.body.removeChild(tempDiv);
      });
    }).catch(error => {
      console.error('PDF generation failed:', error);
      this.showAlert('Failed to generate PDF', 'danger');
      document.body.removeChild(tempDiv);
    });
  }
  
  formatDateDisplay(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  }
  
  
  printChecklist() {
    
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      this.showAlert('Please allow pop-ups to print the checklist', 'warning');
      return;
    }
    
    
    const currentDate = new Date().toLocaleDateString();
    
    
    const totalItems = this.checklistItems.length;
    const packedItems = this.checklistItems.filter(item => this.packedMap[item]).length;
    const percentPacked = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;
    
    
    let printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Packing Checklist - ${this.selectedCountry || 'Trip'}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #69BB66;
            padding-bottom: 10px;
          }
          h1 {
            color: #14532d;
            margin-bottom: 5px;
          }
          .trip-details {
            font-size: 16px;
            color: #666;
            margin-bottom: 5px;
          }
          .progress-info {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 10px;
            margin: 15px 0;
            text-align: center;
          }
          .progress-bar {
            background-color: #e9ecef;
            border-radius: 5px;
            height: 20px;
            margin: 10px 0;
            overflow: hidden;
          }
          .progress-filled {
            background-color: #69BB66;
            height: 100%;
            text-align: center;
            color: white;
            line-height: 20px;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px 8px;
            text-align: left;
          }
          th {
            background-color: #14532d;
            color: white;
          }
          tr:nth-child(even) {
            background-color: #f2f2f2;
          }
          .packed {
            background-color: #e8f5e9;
            text-decoration: line-through;
            color: #666;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 14px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          .checkbox {
            font-family: Arial;
            font-size: 18px;
          }
          @media print {
            body { margin: 0.5cm; }
            .no-print { display: none; }
            button { display: none; }
            @page { margin: 1cm; }
          }
          @media screen and (max-width: 600px) {
            body { margin: 10px; }
            .trip-details { font-size: 14px; }
            th, td { padding: 8px 4px; font-size: 14px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Packing Checklist</h1>
          ${this.selectedCountry ? `<p class="trip-details">Trip to: <strong>${this.selectedCountry}</strong></p>` : ''}
          ${this.startDate && this.endDate ? 
            `<p class="trip-details">Dates: <strong>${this.formatDateDisplay(this.startDate)}</strong> to <strong>${this.formatDateDisplay(this.endDate)}</strong></p>` : ''}
          ${this.selectedTripType ? `<p class="trip-details">Trip Type: <strong>${this.selectedTripType}</strong></p>` : ''}
          <p class="trip-details">Generated on: <strong>${currentDate}</strong></p>
        </div>
        
        <div class="progress-info">
          <p><strong>${packedItems}</strong> out of <strong>${totalItems}</strong> items packed (${percentPacked}%)</p>
          <div class="progress-bar">
            <div class="progress-filled" style="width: ${percentPacked}%;">${percentPacked}%</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 70%;">Item</th>
              <th style="width: 30%;">Status</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    
    this.checklistItems.forEach(item => {
      const isPacked = this.packedMap[item] || false;
      printContent += `
        <tr class="${isPacked ? 'packed' : ''}">
          <td>${item}</td>
          <td>
            <span class="checkbox">${isPacked ? '✓' : '☐'}</span>
            ${isPacked ? ' Packed' : ' Not Packed'}
          </td>
        </tr>
      `;
    });
    
    
    printContent += `
          </tbody>
        </table>
        
        <div class="footer">
          <p>Generated by PackPal - Your Smart Packing Assistant</p>
          <button class="no-print" onclick="window.print();">Print This Page</button>
        </div>
        
        <script>
          
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;
    
    
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  }
}