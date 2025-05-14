export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  mood?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}
