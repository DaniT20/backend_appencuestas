import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

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

    @IsString()
    @IsNotEmpty()
    parroquia: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsBoolean()
    @IsOptional()
    lider?: boolean;

    @IsBoolean()
    @IsOptional()
    active?: boolean;
}
