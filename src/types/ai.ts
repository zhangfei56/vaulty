export interface AISuggestion {
  id: string;
  content: string;
  category: 'productivity' | 'health' | 'habit' | 'general';
  generatedAt: string;
  relatedData?: {
    type: 'diary' | 'todo' | 'appUsage';
    id?: string;
  };
  status: 'new' | 'read' | 'implemented' | 'dismissed';
}
