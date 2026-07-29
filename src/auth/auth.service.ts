import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    constructor(
        private users: UsersService,
        private jwt: JwtService
    ) { }

    async login(loginDto: LoginDto) {
        const { username, password, clientType } = loginDto;

        const user = await this.users.findByUsername(username);
        if (!user) throw new UnauthorizedException('Credenciales inválidas');

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) throw new UnauthorizedException('Credenciales inválidas');

        if (!user.active) {
            throw new ForbiddenException('Cuenta pendiente de activación. Contacta al administrador.');
        }

        if (user.role === 'enumerator' && clientType === 'web') {
            throw new ForbiddenException('Credenciales inválidas');
        }

        const payload = {
            sub: user._id,
            username: user.username,
            name: user.name ?? null,
            role: user.role,
            parroquias: user.parroquias ?? [],
            lider: user.lider ?? false,
        };

        const token = this.jwt.sign(payload, {
            secret: process.env.JWT_SECRET,
            expiresIn: '30d',
        });

        this.users.updateLastLogin(user._id.toString()).catch(() => {});

        return {
            access_token: token,
            user: {
                id: user._id,
                username: user.username,
                name: user.name ?? '',
                role: user.role,
            }
        };
    }

    async register(dto: RegisterDto) {
        await this.users.create({
            name: dto.name,
            username: dto.username,
            password: dto.password,
            role: 'enumerator',
            parroquias: dto.parroquias ?? [],
            phone: dto.phone ?? undefined,
            active: false,
        });
        return { message: 'Cuenta creada. Un administrador debe activarla antes de que puedas ingresar.' };
    }
}