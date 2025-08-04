// in src/types/index.ts

export interface ApiFile {
  id: string;
  filename: string;
  processing_status: 'pending' | 'processing' | 'classification' | 'completed' | 'failed';
  created_at: string; // ISO 8601 date string
}

export interface ApiSubFile {
  id: string;
  filename: string;
  file_type: string; // AI classification result
  // Assuming there might be a status for sub-files as well
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'; 
}
