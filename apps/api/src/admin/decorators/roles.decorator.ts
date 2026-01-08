import { SetMetadata } from '@nestjs/common';
import { SistemRolu } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: SistemRolu[]) => SetMetadata(ROLES_KEY, roles);

// Kısayollar
export const AdminOnly = () => Roles(SistemRolu.ADMIN);
export const ModeratorOnly = () => Roles(SistemRolu.ADMIN, SistemRolu.MODERATOR);
