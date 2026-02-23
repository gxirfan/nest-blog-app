export class SearchResultDto {
  type: 'user' | 'post' | 'tag' | 'topic' | 'flow';
  id: string;
  title: string;
  subTitle?: string;
  url: string;
  avatar?: string;
}
