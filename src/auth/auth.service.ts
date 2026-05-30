import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';

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

        // 🔐 REGLA CLAVE
        if (user.role === 'enumerator' && clientType === 'web') {
            throw new ForbiddenException(
                /* 'El usuario enumerator no puede ingresar al sistema web' */
                'Credenciales inválidas'
            );
        }

        const payload = {
            sub: user._id,
            username: user.username,
            role: user.role,
        };

        const token = this.jwt.sign(payload, {
            secret: process.env.JWT_SECRET,
            expiresIn: '30d',
        });

        return {
            access_token: token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
            }
        };
    }
}