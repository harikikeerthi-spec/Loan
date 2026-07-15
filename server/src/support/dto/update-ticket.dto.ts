import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTicketDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  loanApplicationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  loanApplicationNum?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  loanStage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  universityName?: string;
}

export class UpdateStatusDto {
  @ApiPropertyOptional()
  @IsString()
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdatePriorityDto {
  @IsString()
  priority: string;
}

export class AssignTicketDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedToName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  teamId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  teamName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentName?: string;
}
