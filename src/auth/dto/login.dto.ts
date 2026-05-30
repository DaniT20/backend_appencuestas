import { IsIn, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @IsString()
    username: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    @IsIn(['web', 'mobile'])
    clientType: 'web' | 'mobile';
}