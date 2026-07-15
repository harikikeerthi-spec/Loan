import { IsString, IsOptional, IsEnum, IsArray, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TicketPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum TicketCategory {
  LOAN_APPLICATION = 'Loan Application',
  BANK_STATEMENT = 'Bank Statement',
  EVV = 'EVV',
  OCR = 'OCR',
  DIGILOCKER = 'Digilocker',
  DOCUMENT_VERIFICATION = 'Document Verification',
  UNIVERSITY = 'University',
  VISA = 'Visa',
  PAYMENT = 'Payment',
  DISBURSEMENT = 'Disbursement',
  EMI = 'EMI',
  AUTHENTICATION = 'Authentication',
  PROFILE = 'Profile',
  API_ERROR = 'API Error',
  TECHNICAL_ISSUE = 'Technical Issue',
  OTHERS = 'Others',
}

export class CreateTicketDto {
  @ApiProperty({ example: 'Unable to upload Aadhar card' })
  @IsString()
  @MinLength(5)
  subject: string;

  @ApiProperty({ example: 'When I try to upload the Aadhar card, I get a 500 error...' })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ enum: TicketCategory })
  @IsString()
  category: string;

  @ApiPropertyOptional({ enum: TicketPriority, default: 'medium' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  tags?: string[];

  // Related loan context (optional)
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
