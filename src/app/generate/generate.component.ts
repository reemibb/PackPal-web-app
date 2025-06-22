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

  alertMessage: string = '';
  alertType: 'success' | 'danger' | 'warning' | '' = '';



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
// Add this method to your GenerateComponent class
printChecklist() {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow pop-ups to print the checklist.');
    return;
  }
  
  // Get the current date in a readable format
  const currentDate = new Date().toLocaleDateString();
  
  // Calculate total and packed items
  const totalItems = this.checklistItems.length;
  const packedItems = this.checklistItems.filter(item => this.packedMap[item]).length;
  const percentPacked = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;
  
  // Create the HTML content for the print window
  let printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Packing Checklist - ${this.selectedCountry || 'Trip'}</title>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
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
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Packing Checklist</h1>
        ${this.selectedCountry ? `<p class="trip-details">Trip to: <strong>${this.selectedCountry}</strong></p>` : ''}
        ${this.startDate && this.endDate ? 
          `<p class="trip-details">Dates: <strong>${this.startDate}</strong> to <strong>${this.endDate}</strong></p>` : ''}
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
  
  // Add each checklist item
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
  
  // Close the table and add footer
  printContent += `
        </tbody>
      </table>
      
      <div class="footer">
        <p>Generated by PackPal - Your Smart Packing Assistant</p>
        <button class="no-print" onclick="window.print();">Print This Page</button>
      </div>
      
      <script>
        // Auto-trigger print dialog when page loads
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;
  
  // Write the content to the new window and close the document stream
  printWindow.document.open();
  printWindow.document.write(printContent);
  printWindow.document.close();
}
addCustomItem() {
  const trimmedItem = this.newItem.trim();
  if (trimmedItem && !this.packingList.includes(trimmedItem)) {
    this.packingList.push(trimmedItem);
    this.newItem = ''; 
  }
}


generatePackingList() {
  this.packingList = [];

  if (this.selectedTripType === 'Business') {
    this.packingList.push('👔 Formal Clothes', '💼 Laptop');
  } else if (this.selectedTripType === 'Adventure') {
    this.packingList.push('🥾 Hiking Boots', '🧭 Compass');
  } else {
    this.packingList.push('👕 Casual Wear', '📱 Phone Charger');
  }

  
  Object.entries(this.selectedActivities).forEach(([activity, selected]) => {
    if (selected) {
      if (activity === 'Beach') this.packingList.push('🏖️ Swimwear', '🧴 Sunscreen');
      if (activity === 'Hiking') this.packingList.push('🥾 Hiking Shoes', '🎒 Backpack');
      if (activity === 'Photography') this.packingList.push('📷 Camera');
    }
  });

  
  if (this.selectedPack === 'light') this.packingList = this.packingList.slice(0, 5);
  if (this.selectedPack === 'heavy') this.packingList.push('🧳 Extra Clothes', '🔌 Multi-adapter');

  
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
    const apiKey = '87f6122d912722c8b872e1df7db844bc';  
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
    start_date: this.startDate, 
    end_date: this.endDate,     
    trip_type: this.selectedTripType,
    activities: Object.keys(this.selectedActivities).filter(k => this.selectedActivities[k]),
    packing_pref: this.selectedPack,
    weather: this.includeWeather ? this.weatherInfo : null,
    items: this.packingList
  };

  this.http.post('http://localhost/final-asp-php/save_packing_list.php', payload).subscribe({
    next: (res: any) => {
      if (res && res.success) {
        
        const modalElement = document.getElementById('generationModal');
        if (modalElement) {
          
          const modal = new (window as any).bootstrap.Modal(modalElement);
          modal.hide();
        }
        
        
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
  
  const tempDiv = document.createElement('div');
  tempDiv.style.padding = '20px';
  tempDiv.style.fontFamily = 'Arial, sans-serif';
  tempDiv.style.backgroundColor = 'white';
  tempDiv.style.color = 'black';
  
  
  let htmlContent = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #14532d; margin-bottom: 10px;">Packing List</h1>
      <h2 style="color: #666; font-size: 18px;">Trip to ${this.selectedCountry}</h2>
      <p style="color: #888; margin: 5px 0;">${this.startDate} to ${this.endDate}</p>
      <p style="color: #888; margin: 5px 0;">Trip Type: ${this.selectedTripType}</p>
    </div>
  `;

  
  if (this.weatherInfo) {
    htmlContent += `
      <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #14532d; margin-bottom: 10px;">🌤️ Weather in ${this.selectedCountry}</h3>
        <p style="margin: 5px 0;">Temperature: ${this.weatherInfo.main.temp}°C</p>
        <p style="margin: 5px 0;">Condition: ${this.weatherInfo.weather[0].description}</p>
      </div>
    `;
  }

  
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
  
  
  document.body.appendChild(tempDiv);

  
  const opt = {
    margin: 10,
    filename: `PackingList-${this.selectedCountry}-${new Date().toISOString().split('T')[0]}.pdf`,
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
    if (response.success) {
      this.alertMessage = '✅ Progress saved successfully!';
      this.alertType = 'success';
    } else {
      this.alertMessage = '❌ Failed to save: ' + (response.message || 'Unknown error');
      this.alertType = 'danger';
    }
  },
  error: (err) => {
    console.error('❌ Error saving checklist progress:', err);
    this.alertMessage = '❌ Failed to save progress: ' + (err.message || 'Network error');
    this.alertType = 'danger';
  }
});

}
closeAlert() {
  this.alertMessage = '';
  this.alertType = '';
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
