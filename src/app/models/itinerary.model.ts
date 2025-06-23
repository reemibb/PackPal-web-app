export interface ItineraryItem {
  id: number;
  trip_id: number;
  day: number;
  time: string;
  activity: string;
  location?: string;
  notes?: string;
  completed: boolean;
}

export interface Trip {
  id: number;
  user_id: number;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  itinerary: ItineraryItem[];
}