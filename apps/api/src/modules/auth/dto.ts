import { IsEmail, IsOptional, IsString, Length, Matches } from "class-validator";

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(3, 24)
  @Matches(/^[a-zA-Z0-9_\-]+$/, {
    message: "username may only contain letters, numbers, _ and -",
  })
  username!: string;

  @IsString()
  @Length(8, 72)
  password!: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;
}

export class LoginDto {
  @IsString()
  identifier!: string; // email OR username

  @IsString()
  @Length(1, 72)
  password!: string;
}
