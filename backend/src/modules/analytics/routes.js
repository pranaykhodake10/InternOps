const { z } = require('zod');
const auth = require('../../middleware/auth');
const rbac = require('../../middleware/rbac');
const repo = require('./repository');

async function routes(fastify) {
  fastify.get('/overview', { preHandler: [auth, rbac('ADMIN','SENIOR_TL')] }, async () => {
    const pool = require('../../config/db');
    const counts = await pool.query("SELECT role, COUNT(*) FROM users WHERE deleted_at IS NULL GROUP BY role");
    return { users: counts.rows };
  });

  // Department attendance rate (admin/senior TL)
  fastify.get('/department-attendance', { preHandler: [auth, rbac('ADMIN','SENIOR_TL')] }, async (req) => {
    const { departmentId, month, year } = req.query;
    if (!departmentId || !month || !year) throw new Error('departmentId, month, year required');
    return repo.departmentAttendanceRate(departmentId, month, year);
  });

  // Top performers
  fastify.get('/top-performers', { preHandler: [auth, rbac('ADMIN','SENIOR_TL','TL')] }, async (req) => {
    const { role, limit } = z.object({
      role: z.enum(['ADMIN','SENIOR_TL','TL','CAPTAIN','INTERN']).default('INTERN'),
      limit: z.coerce.number().int().min(1).max(50).default(10),
    }).parse(req.query);
    return repo.topPerformers(role, limit);
  });

  // Attendance trends
  fastify.get('/attendance-trends', { preHandler: [auth, rbac('ADMIN','SENIOR_TL')] }, async (req) => {
    const { months } = z.object({
      months: z.coerce.number().int().min(1).max(24).default(6),
    }).parse(req.query);
    return repo.attendanceTrends(months);
  });
}

module.exports = routes;
