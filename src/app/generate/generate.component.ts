// generate.component.ts
import { Component, OnInit, AfterViewInit  } from '@angular/core';
import { ConnectService } from '../connect.service';
import { HttpClient } from '@angular/common/http';

declare var bootstrap: any;

@Component({
  selector: 'app-generate',
  templateUrl: './generate.component.html',
  styleUrls: ['./generate.component.css'],
  standalone: false,
})
export class GenerateComponent implements OnInit, AfterViewInit {
  content = {
    title: '',
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

  modalInstance: any;
  newItem: string = '';

  checklistItems: string[] = [];
  packedMap: { [item: string]: boolean } = {};
  lastPackingListId: number = 0;



  constructor(private connectService: ConnectService, private http: HttpClient) {}
  

  ngOnInit() {
    this.connectService.getGenerateContent().subscribe(res => {
      if (res.success) {
        this.content = res.data;
      }
    });
    this.loadCountries();
    this.fetchUserPackingList();
  }
  ngAfterViewInit() {
    const modalElement = document.getElementById('generationModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement);
    }
  }
  loadCountries() {
  this.http.get<any>('http://localhost/final-asp-php/get_countries.php').subscribe(res => {
    if (res.success) {
      this.countries = res.data;
    } else {
      console.error('Failed to load countries');
    }
  }, error => {
    console.error('HTTP error when fetching countries', error);
  });
}
addCustomItem() {
  const trimmedItem = this.newItem.trim();
  if (trimmedItem && !this.packingList.includes(trimmedItem)) {
    this.packingList.push(trimmedItem);
    this.newItem = ''; // clear the input
  }
}


generatePackingList() {
  this.packingList = [];

  // Base items
  if (this.selectedTripType === 'Business') {
    this.packingList.push('👔 Formal Clothes', '💼 Laptop');
  } else if (this.selectedTripType === 'Adventure') {
    this.packingList.push('🥾 Hiking Boots', '🧭 Compass');
  } else {
    this.packingList.push('👕 Casual Wear', '📱 Phone Charger');
  }

  // Activities
  Object.entries(this.selectedActivities).forEach(([activity, selected]) => {
    if (selected) {
      if (activity === 'Beach') this.packingList.push('🏖️ Swimwear', '🧴 Sunscreen');
      if (activity === 'Hiking') this.packingList.push('🥾 Hiking Shoes', '🎒 Backpack');
      if (activity === 'Photography') this.packingList.push('📷 Camera');
    }
  });

  // Packing preference
  if (this.selectedPack === 'light') this.packingList = this.packingList.slice(0, 5);
  if (this.selectedPack === 'heavy') this.packingList.push('🧳 Extra Clothes', '🔌 Multi-adapter');

  // Weather
  if (this.includeWeather && this.weatherInfo) {
    const temp = this.weatherInfo.main.temp;
    if (temp < 15) this.packingList.push('🧥 Warm Jacket');
    else if (temp > 28) this.packingList.push('🕶️ Sunglasses');
  }
  if (this.modalInstance) this.modalInstance.show();
}
closeModal() {
    if (this.modalInstance) this.modalInstance.hide();
  }
removeItem(item: string) {
  this.packingList = this.packingList.filter(i => i !== item);
}



  onToggleWeather() {
    if (this.includeWeather && this.selectedCountry) {
      this.fetchWeather(this.selectedCountry);
    } else {
      this.weatherInfo = null;
    }
  }

  fetchWeather(country: string) {
    const apiKey = '87f6122d912722c8b872e1df7db844bc';  // Get one from OpenWeatherMap or similar
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${country}&appid=${apiKey}&units=metric`;

    this.http.get(apiUrl).subscribe(
      data => this.weatherInfo = data,
      err => console.error('Failed to fetch weather', err)
    );
  }

  saveAndExport() {
    this.packingList = this.packingList.filter(item => !!item && item.trim() !== '');
  const user_id = localStorage.getItem('user_id');
  if (!user_id) {
    alert('User not logged in');
    return;
  }

  const payload = {
    user_id: Number(user_id),
    destination: this.selectedCountry,
    start_date: this.startDate, // Use the component property directly
    end_date: this.endDate,     // Use the component property directly
    trip_type: this.selectedTripType,
    activities: Object.keys(this.selectedActivities).filter(k => this.selectedActivities[k]),
    packing_pref: this.selectedPack,
    weather: this.includeWeather ? this.weatherInfo : null,
    items: this.packingList
  };

  this.http.post('http://localhost/final-asp-php/save_packing_list.php', payload).subscribe({
    next: (res: any) => {
      if (res && res.success) {
        // Close the modal first
        const modalElement = document.getElementById('generationModal');
        if (modalElement) {
          // Use Bootstrap's modal methods to properly close
          const modal = new (window as any).bootstrap.Modal(modalElement);
          modal.hide();
        }
        
        // Generate PDF after a short delay to ensure modal is closed
        setTimeout(() => {
          this.exportAsPDF();
        }, 500);
      } else {
        alert('Failed to save: ' + (res.message || 'Unknown error'));
      }
    },
    error: (error) => {
      console.error('Save error:', error);
      alert('Failed to save packing list');
    }
  });
}

exportAsPDF() {
  // Create a temporary div with the content we want to export
  const tempDiv = document.createElement('div');
  tempDiv.style.padding = '20px';
  tempDiv.style.fontFamily = 'Arial, sans-serif';
  tempDiv.style.backgroundColor = 'white';
  tempDiv.style.color = 'black';
  
  // Build the HTML content for PDF
  let htmlContent = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #14532d; margin-bottom: 10px;">Packing List</h1>
      <h2 style="color: #666; font-size: 18px;">Trip to ${this.selectedCountry}</h2>
      <p style="color: #888; margin: 5px 0;">${this.startDate} to ${this.endDate}</p>
      <p style="color: #888; margin: 5px 0;">Trip Type: ${this.selectedTripType}</p>
    </div>
  `;

  // Add weather info if available
  if (this.weatherInfo) {
    htmlContent += `
      <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #14532d; margin-bottom: 10px;">🌤️ Weather in ${this.selectedCountry}</h3>
        <p style="margin: 5px 0;">Temperature: ${this.weatherInfo.main.temp}°C</p>
        <p style="margin: 5px 0;">Condition: ${this.weatherInfo.weather[0].description}</p>
      </div>
    `;
  }

  // Add packing list
  htmlContent += `
    <div style="margin-bottom: 20px;">
      <h3 style="color: #14532d; margin-bottom: 15px;">📦 Packing Items</h3>
      <ul style="list-style-type: none; padding: 0;">
  `;

  this.packingList.forEach(item => {
    htmlContent += `<li style="padding: 8px 0; border-bottom: 1px solid #eee; font-size: 16px;">✓ ${item}</li>`;
  });

  htmlContent += `
      </ul>
    </div>
    <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
      Generated on ${new Date().toLocaleDateString()}
    </div>
  `;

  tempDiv.innerHTML = htmlContent;
  
  // Temporarily add to DOM for html2pdf
  document.body.appendChild(tempDiv);

  // Configure PDF options
  const opt = {
    margin: 10,
    filename: `PackingList-${this.selectedCountry}-${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // Generate PDF
  // @ts-ignore
  import('html2pdf.js').then((html2pdf: any) => {
    html2pdf.default().set(opt).from(tempDiv).save().then(() => {
      // Clean up - remove temp div
      document.body.removeChild(tempDiv);
    });
  }).catch(error => {
    console.error('PDF generation failed:', error);
    document.body.removeChild(tempDiv);
  });
}



fetchUserPackingList() {
  const user_id = localStorage.getItem('user_id');
  if (!user_id) return;

  const url = `http://localhost/final-asp-php/get_packing_list.php?user_id=${user_id}`;

  this.http.get<any>(url).subscribe({
    next: (res) => {
      if (res.success && Array.isArray(res.items)) {
        this.checklistItems = res.items;
        this.lastPackingListId = res.packing_list_id;

        res.items.forEach((item: string) => {
          this.packedMap[item] = res.packed_status?.[item] ?? false;
        });
      } else {
        console.warn('⚠️ No packing list data');
      }
    },
    error: (err) => {
      console.error('❌ Failed to fetch packing list:', err);
    }
  });
}

saveChecklistProgress() {
  const user_id = localStorage.getItem('user_id');
  console.log('💾 Saving checklist progress...');
  console.log('🆔 User ID:', user_id);
  console.log('🆔 Packing List ID:', this.lastPackingListId);
  console.log('📋 Checklist items:', this.checklistItems);
  
  if (!user_id || !this.checklistItems.length) {
    alert('No user or checklist items found');
    return;
  }

  if (!this.lastPackingListId || this.lastPackingListId <= 0) {
    alert('No packing list ID found. Please generate a packing list first.');
    return;
  }

  const payload = this.checklistItems.map(item => ({
    user_id: Number(user_id),
    item_name: item,
    is_checked: this.packedMap[item] || false,
    packing_list_id: this.lastPackingListId
  }));

  console.log('📤 Sending payload:', payload);

  this.http.post('http://localhost/final-asp-php/save_checklist.php', payload).subscribe({
    next: (response: any) => {
      console.log('✅ Save response:', response);
      if (response.success) {
        alert('✅ Progress saved successfully!');
      } else {
        alert('❌ Failed to save: ' + (response.message || 'Unknown error'));
      }
    },
    error: (err) => {
      console.error('❌ Error saving checklist progress:', err);
      alert('❌ Failed to save progress: ' + (err.message || 'Network error'));
    }
  });
}
onChecklistChange(item: string, checked: boolean) {
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
        console.log(`✅ Item "${item}" updated successfully.`);
      } else {
        console.warn(`❌ Failed to update "${item}": ${response.message}`);
      }
    },
    error: err => {
      console.error(`❌ Network error saving "${item}":`, err);
    }
  });
}



}
