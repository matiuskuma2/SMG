export interface Enquete {
  id: string;
  eventName: string;
  eventDate: string;
  responseDeadline: string;
  responseCount: number;
  status?: 'draft' | 'published' | 'closed';
  createdAt?: string;
  updatedAt?: string;
}
