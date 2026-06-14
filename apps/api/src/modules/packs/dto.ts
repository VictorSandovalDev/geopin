import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  Matches,
} from "class-validator";

export class CreatePackDto {
  @IsString()
  @Length(2, 40)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(0, 80)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(1, 8)
  emoji?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(40)
  @ArrayUnique()
  @IsString({ each: true })
  @Matches(/^[A-Z]{2}$/, { each: true, message: "countries must be ISO-2 codes" })
  countries!: string[];

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
