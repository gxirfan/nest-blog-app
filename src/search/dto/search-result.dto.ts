export class SearchResultDto {
  type: 'user' | 'post' | 'tag' | 'topic' | 'flow';
  id: number;
  title: string;
  subTitle?: string;
  url: string;
  avatar?: string;
}
