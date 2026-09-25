import type { CreateCommentRequest } from '@lt/shared';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto implements CreateCommentRequest {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  body: string;
}
