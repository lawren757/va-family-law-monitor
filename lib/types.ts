export interface UpdateItem {
  id: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  summary: string;
  sourceName: string;
  sourceUrl: string;
  citation: string | null;
  court: string | null;
  blogCredit: string | null;
  blogUrl: string | null;
  searchTags: string;
}
