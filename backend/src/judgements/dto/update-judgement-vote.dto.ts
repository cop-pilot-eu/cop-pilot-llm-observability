import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateJudgementVoteDto {
  @IsNotEmpty()
  @IsBoolean()
  isLike: boolean;
}
