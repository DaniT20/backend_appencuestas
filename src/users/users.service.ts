import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';

import { User } from './user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { BulkCreateUserItemDto } from './dto/bulk-create-users.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private model: Model<User>) { }

  private normalizeUsername(username: string): string {
    return username.trim().toLowerCase();
  }

  private sanitizeName(name: string): string {
    return name.trim();
  }

  async create(dto: CreateUserDto) {
    const username = this.normalizeUsername(dto.username);
    const name = this.sanitizeName(dto.name);

    const exists = await this.model.exists({ username });
    if (exists) {
      throw new ConflictException('El nombre de usuario ya existe.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const created = new this.model({
      name,
      username,
      passwordHash,
      role: dto.role,
      active: dto.active ?? true,
    });

    const saved = await created.save();
    return saved.toObject();
  }

  async bulkCreate(users: BulkCreateUserItemDto[]) {
    if (!users?.length) {
      throw new BadRequestException('Debe enviar al menos un usuario.');
    }

    const errors: Array<{ row: number; username: string; reason: string }> = [];
    const validItems: Array<{
      row: number;
      name: string;
      username: string;
      password: string;
      role: 'admin' | 'enumerator';
      active: boolean;
    }> = [];

    const seen = new Set<string>();

    for (let i = 0; i < users.length; i++) {
      const row = i + 1;
      const item = users[i];

      const name = item?.name?.trim?.() ?? '';
      const username = item?.username?.trim?.().toLowerCase?.() ?? '';
      const password = item?.password ?? '';
      const role = item?.role;
      const active = item?.active ?? true;

      if (!name) {
        errors.push({ row, username, reason: 'name is required' });
        continue;
      }

      if (!username) {
        errors.push({ row, username, reason: 'username is required' });
        continue;
      }

      if (username.length < 3) {
        errors.push({ row, username, reason: 'username must be at least 3 characters' });
        continue;
      }

      if (!password || password.length < 6) {
        errors.push({ row, username, reason: 'password must be at least 6 characters' });
        continue;
      }

      if (role !== 'admin' && role !== 'enumerator') {
        errors.push({ row, username, reason: 'invalid role' });
        continue;
      }

      if (seen.has(username)) {
        errors.push({ row, username, reason: 'duplicate username in request' });
        continue;
      }

      seen.add(username);

      validItems.push({
        row,
        name,
        username,
        password,
        role,
        active,
      });
    }

    if (!validItems.length) {
      return {
        total: users.length,
        created: 0,
        failed: errors.length,
        errors,
      };
    }

    const usernames = validItems.map(u => u.username);
    const existingUsers = await this.model
      .find({ username: { $in: usernames } })
      .select({ username: 1 })
      .lean()
      .exec();

    const existingSet = new Set(existingUsers.map(u => u.username));

    const toInsert: Array<{
      name: string;
      username: string;
      passwordHash: string;
      role: 'admin' | 'enumerator';
      active: boolean;
    }> = [];

    for (const item of validItems) {
      if (existingSet.has(item.username)) {
        errors.push({
          row: item.row,
          username: item.username,
          reason: 'username already exists',
        });
        continue;
      }

      const passwordHash = await bcrypt.hash(item.password, 10);

      toInsert.push({
        name: item.name,
        username: item.username,
        passwordHash,
        role: item.role,
        active: item.active,
      });
    }

    if (toInsert.length) {
      await this.model.insertMany(toInsert, { ordered: false });
    }

    return {
      total: users.length,
      created: toInsert.length,
      failed: errors.length,
      errors: errors.sort((a, b) => a.row - b.row),
    };
  }

  async findAll(query: QueryUsersDto) {
    const { page = 1, limit = 10, search, active } = query;

    const filter: FilterQuery<User> = {};

    if (search?.trim()) {
      const text = search.trim();
      filter.$or = [
        { username: { $regex: text, $options: 'i' } },
        { name: { $regex: text, $options: 'i' } },
      ];
    }

    if (active === 'true' || active === 'false') {
      filter.active = active === 'true';
    }

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.model.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const user = await this.model.findById(id).lean().exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByUsername(username: string) {
    const normalized = this.normalizeUsername(username);
    return await this.model.findOne({ username: normalized }).lean().exec();
  }

  async update(id: string, dto: UpdateUserDto) {
    const payload: any = {};

    if (dto.name !== undefined) {
      payload.name = this.sanitizeName(dto.name);
    }

    if (dto.username !== undefined) {
      payload.username = this.normalizeUsername(dto.username);

      const existing = await this.model.findOne({
        username: payload.username,
        _id: { $ne: id },
      }).lean();

      if (existing) {
        throw new ConflictException('El nombre de usuario ya existe.');
      }
    }

    if (dto.password) {
      payload.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (dto.role !== undefined) {
      payload.role = dto.role;
    }

    if (dto.active !== undefined) {
      payload.active = dto.active;
    }

    const updated = await this.model
      .findOneAndUpdate({ _id: id }, { $set: payload }, { new: true })
      .lean()
      .exec();

    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async remove(id: string) {
    const res = await this.model.findByIdAndDelete(id).lean().exec();
    if (!res) throw new NotFoundException('User not found');
    return { deleted: true, id };
  }
}