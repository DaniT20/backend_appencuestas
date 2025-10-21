import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(private users: UsersService, private jwt: JwtService) { }

    async login(username: string, password: string) {
        const user = await this.users.findByUsername(username);
        if (!user) throw new UnauthorizedException('Credenciales inválidas');
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) throw new UnauthorizedException('Credenciales inválidas');

        const payload = { sub: user.id, username: user.username, role: user.role };

        const token = this.jwt.sign(payload, {
            secret: process.env.JWT_SECRET,
            expiresIn: '7d',
        });

        return { access_token: token};
    }
}
