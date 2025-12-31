export type ContactType = 
  | 'brand'
  | 'agency'
  | 'casting'
  | 'partnerships'
  | 'press'
  | 'support'
  | 'affiliate'
  | 'influencer';

export type RequestStatus = 'new' | 'reviewed' | 'added' | 'rejected';

export type EntrySource = 'curated' | 'user_request' | 'import' | 'partner';

export interface BrandAccessEntry {
  id: string;
  brand_name: string;
  website_url: string | null;
  contact_url: string;
  contact_type: ContactType;
  tags: string[];
  notes: string | null;
  country: string | null;
  city: string | null;
  source: EntrySource;
  last_verified: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandAccessEntryPreview {
  id: string;
  brand_name: string;
  website_url: string | null;
  contact_type: ContactType;
  tags: string[];
  notes: string | null;
  country: string | null;
  city: string | null;
  last_verified: string | null;
  locked: true;
}

export interface BrandAccessRequest {
  id: string;
  requested_brand_name: string;
  requested_website_url: string | null;
  request_reason: string | null;
  user_email: string | null;
  user_id: number | null;
  status: RequestStatus;
  created_at: string;
}

export interface ListEntriesParams {
  q?: string;
  type?: ContactType;
  tag?: string;
  limit?: number;
}

export interface CreateRequestParams {
  requested_brand_name: string;
  requested_website_url?: string;
  request_reason?: string;
  user_email?: string;
  user_id?: number;
}
