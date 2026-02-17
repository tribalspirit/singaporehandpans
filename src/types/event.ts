export interface EventContent {
  title: string;
  description: string;
  date: string;
  location: string;
  price?: string;
  booking_url?: string;
  image?: {
    filename: string;
    alt?: string;
  };
  tags?: string | string[];
  status?: string;
  availability_status?: 'available' | 'few_spots' | 'sold_out';
  max_participants?: number;
  seo_title?: string;
  seo_description?: string;
  // Acuity Scheduling fields
  acuity_type?: 'workshop' | 'private';
  acuity_appointment_type_id?: string;
  acuity_class_id?: string;
  sold_out_override?: boolean;
  spots_remaining?: number;
}

export interface EventStory {
  id: string;
  name: string;
  slug: string;
  content: EventContent;
}
