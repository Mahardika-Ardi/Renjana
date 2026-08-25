import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MoodValue } from '@prisma/client';

export enum MoodTag {
  GRATITUDE = 'gratitude',
  REFLECTION = 'reflection',
  COMMITMENT = 'commitment',
  CHALLENGE = 'challenge',
  PEACE = 'peace',
}

export class CreateMoodDto {
  @ApiProperty({
    description: 'Mood value: 1=Very Bad, 2=Bad, 3=Neutral, 4=Good, 5=Very Good',
    enum: MoodValue,
  })
  @IsEnum(MoodValue)
  mood: MoodValue;

  @ApiPropertyOptional({
    description: 'Intensity level 1-5, default 3',
    default: 3,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  intensity?: number;

  @ApiPropertyOptional({
    description: 'Tanggal log mood (YYYY-MM-DD)',
    example: '2026-08-22',
  })
  @IsOptional()
  @IsString()
  logDate?: string;

  @ApiPropertyOptional({
    description: 'Catatan atau refleksi ringan',
    example: 'Hari ini merasa cukup produktif',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Tag atau kategori mood',
    example: ['gratitude'],
    isArray: true,
  })
  @IsOptional()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateMoodDto {
  @ApiPropertyOptional({
    description: 'Mood value baru',
    enum: MoodValue,
  })
  @IsOptional()
  @IsEnum(MoodValue)
  mood?: MoodValue;

  @ApiPropertyOptional({
    description: 'Intensity level baru 1-5',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  intensity?: number;

  @ApiPropertyOptional({ description: 'Catatan baru' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Tag baru', isArray: true })
  @IsOptional()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  tags?: string[];
}