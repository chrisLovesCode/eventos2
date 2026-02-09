import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsSlug } from '../../common/validators/slug.validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @ApiProperty({
    description: 'Category name',
    example: 'Conference',
    minLength: 2,
    maxLength: 100,
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsSlug()
  @ApiProperty({
    description: 'URL-friendly slug for the category',
    example: 'conference',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
  })
  slug: string;
}
