import { SetMetadata } from '@nestjs/common';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Array<'admin' | 'enumerator'>) => SetMetadata(ROLES_KEY, roles);
