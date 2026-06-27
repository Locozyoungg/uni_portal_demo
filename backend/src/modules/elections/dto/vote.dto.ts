import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VoteDto {
  @ApiProperty()
  @IsString()
  candidateId: string;
}

export class ExchangeTokenDto {
  @ApiProperty()
  @IsString()
  token: string;
}

export class ToggleModeDto {
  @ApiProperty()
  @IsString()
  mode: string;
}
