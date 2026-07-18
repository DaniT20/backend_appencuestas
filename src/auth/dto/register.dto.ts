import { IsArray, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

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

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    parroquias?: string[];

    @IsString()
    @IsOptional()
    phone?: string;
}
