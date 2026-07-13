import { IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsString()
    @IsNotEmpty()
    parroquia: string;

    @IsString()
    @IsOptional()
    phone?: string;
}
