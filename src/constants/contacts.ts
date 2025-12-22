export const STUDIO_NAME = 'Singapore Handpan Studio';

export const STUDIO_ADDRESS = "195 Pearl's Hill Ter, #03-07, Singapore 168976";

export const STUDIO_ADDRESS_LINES = [
  "195 Pearl's Hill Ter, #03-07",
  "Singapore 168976"
];

export const STUDIO_PHONE_PRIMARY = '+65 9685 7818';
export const STUDIO_PHONE_PRIMARY_TEL = 'tel:+6596857818';
export const STUDIO_PHONE_HOURS = 'Daily 10:00 AM - 8:00 PM';
export const STUDIO_PHONE_NOTE = 'If no answer, you may contact via WhatsApp.';

export const STUDIO_EMAIL = 'singaporehandpanstduio@gmail.com';
export const STUDIO_EMAIL_MAILTO = 'mailto:singaporehandpanstduio@gmail.com';
export const STUDIO_EMAIL_RESPONSE_TIME = 'We reply within 24 hours';

export interface SocialLink {
  id: string;
  label: string;
  href: string;
  ariaLabel: string;
  icon?: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'facebook',
    label: 'Facebook',
    href: 'https://www.facebook.com/yana.an.54/',
    ariaLabel: 'Follow us on Facebook',
    icon: 'facebook'
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://www.instagram.com/singapore_handpans',
    ariaLabel: 'Follow us on Instagram',
    icon: 'instagram'
  },
  {
    id: 'youtube',
    label: 'YouTube',
    href: 'https://www.youtube.com/@SingaporeHandpanStudio',
    ariaLabel: 'Subscribe to our YouTube channel',
    icon: 'youtube'
  }
];

export const WHATSAPP_LINK = `https://wa.me/6596857818`;
export const WHATSAPP_LABEL = 'Contact via WhatsApp';

export const GOOGLE_MAPS_ADDRESS = encodeURIComponent(STUDIO_ADDRESS);
export const GOOGLE_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${GOOGLE_MAPS_ADDRESS}`;
export const GOOGLE_MAPS_EMBED_URL = `https://maps.google.com/maps?q=${GOOGLE_MAPS_ADDRESS}&output=embed`;

