import { IsNotEmpty, IsUrl } from 'class-validator';

export class CreateStoryDto {
  @IsNotEmpty()
  @IsUrl()
  mediaUrl: string;
}
