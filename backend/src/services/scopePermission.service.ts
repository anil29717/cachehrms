import { randomUUID } from 'crypto';
import { prisma } from '../config/database.js';
import { SCOPES_TREE, isValidScopeId } from '../config/scopes.js';
import { errors } from '../utils/errors.js';
import type { ScopeNode } from '../config/scopes.js';

export type ScopePermission = {
  scopeId: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export type ScopePermissionMap = Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }>;

export class ScopePermissionService {
  getScopesTree(): ScopeNode[] {
    return JSON.parse(JSON.stringify(SCOPES_TREE));
  }

  async getUserPermissions(userId: string): Promise<ScopePermission[]> {
    try {
      const rows = await prisma.userScopePermission.findMany({
        where: { userId: userId },
        select: { scopeId: true, canView: true, canCreate: true, canEdit: true, canDelete: true },
      });
      return rows.map((r) => ({
        scopeId: r.scopeId,
        canView: r.canView,
        canCreate: r.canCreate,
        canEdit: r.canEdit,
        canDelete: r.canDelete,
      }));
    } catch {
      return [];
    }
  }

  /** Returns a map of scopeId -> { canView, canCreate, canEdit, canDelete } for middleware / login response. */
  async getUserPermissionMap(userId: string): Promise<ScopePermissionMap> {
    const list = await this.getUserPermissions(userId);
    const map: ScopePermissionMap = {};
    for (const p of list) {
      map[p.scopeId] = {
        canView: p.canView,
        canCreate: p.canCreate,
        canEdit: p.canEdit,
        canDelete: p.canDelete,
      };
    }
    return map;
  }

  async setUserPermissions(userId: string, permissions: ScopePermission[]): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw errors.notFound('User');

    const valid = permissions.filter((p) => p?.scopeId && isValidScopeId(p.scopeId));
    const byScope = new Map<string, ScopePermission>();
    valid.forEach((p) => byScope.set(p.scopeId, p));
    const unique = Array.from(byScope.values());

    try {
      await prisma.userScopePermission.deleteMany({ where: { userId } });

      if (unique.length > 0) {
        await prisma.userScopePermission.createMany({
          data: unique.map((p) => ({
            id: randomUUID(),
            userId,
            scopeId: p.scopeId,
            canView: Boolean(p.canView),
            canCreate: Boolean(p.canCreate),
            canEdit: Boolean(p.canEdit),
            canDelete: Boolean(p.canDelete),
          })),
          skipDuplicates: true,
        });
      }
    } catch (err) {
      const msg = (err as Error).message ?? String(err);
      if (msg.includes('user_scope_permissions') || msg.includes('does not exist') || msg.includes('relation')) {
        throw errors.badRequest(
          'Permissions table is missing. Run in backend: npx prisma migrate dev && npx prisma generate, then restart the server.'
        );
      }
      throw err;
    }
  }
}
