import { IsArray, IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
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
    @IsIn(['admin', 'enumerator', 'gestor'])
    role: 'admin' | 'enumerator' | 'gestor';

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    parroquias?: string[];

    @IsString()
    @IsOptional()
    phone?: string;

    @IsBoolean()
    @IsOptional()
    lider?: boolean;

    @IsBoolean()
    @IsOptional()
    active?: boolean;

    @IsString()
    @IsOptional()
    photoUrl?: string;
}
