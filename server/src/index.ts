
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Schema imports
import { 
  loginInputSchema,
  createUserInputSchema,
  createStudentInputSchema,
  createStaffInputSchema,
  createClassInputSchema,
  createTransactionInputSchema,
  updatePasswordInputSchema,
  resetPasswordInputSchema,
  reportFiltersSchema,
  userRoleSchema
} from './schema';

// Handler imports
import { login, logout, validateSession } from './handlers/auth';
import { createUser, getAllUsers, getUserById, updatePassword, resetPassword, toggleUserStatus } from './handlers/users';
import { createStudent, getAllStudents, getStudentById, getStudentsByClass } from './handlers/students';
import { createStaff, getAllStaff, getStaffById } from './handlers/staff';
import { createClass, getAllClasses, getClassById, updateClass, deleteClass } from './handlers/classes';
import { createTransaction, getTransactionsByStudent, getTransactionsByStaff, getTransactionsReport, getDailyTransactionSummary } from './handlers/transactions';
import { getDashboardStats, getStudentDashboard, getStaffDashboard } from './handlers/dashboard';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => login(input)),
  
  logout: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(({ input }) => logout(input.sessionId)),
  
  validateSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(({ input }) => validateSession(input.sessionId)),

  // User management routes (Administrator)
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getAllUsers: publicProcedure
    .query(() => getAllUsers()),
  
  getUserById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getUserById(input.id)),
  
  updatePassword: publicProcedure
    .input(updatePasswordInputSchema.extend({ userId: z.number() }))
    .mutation(({ input }) => {
      const { userId, ...passwordInput } = input;
      return updatePassword(userId, passwordInput);
    }),
  
  resetPassword: publicProcedure
    .input(resetPasswordInputSchema)
    .mutation(({ input }) => resetPassword(input)),
  
  toggleUserStatus: publicProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(({ input }) => toggleUserStatus(input.userId)),

  // Student management routes
  createStudent: publicProcedure
    .input(createStudentInputSchema)
    .mutation(({ input }) => createStudent(input)),
  
  getAllStudents: publicProcedure
    .query(() => getAllStudents()),
  
  getStudentById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getStudentById(input.id)),
  
  getStudentsByClass: publicProcedure
    .input(z.object({ classId: z.number() }))
    .query(({ input }) => getStudentsByClass(input.classId)),

  // Staff management routes
  createStaff: publicProcedure
    .input(createStaffInputSchema)
    .mutation(({ input }) => createStaff(input)),
  
  getAllStaff: publicProcedure
    .query(() => getAllStaff()),
  
  getStaffById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getStaffById(input.id)),

  // Class management routes
  createClass: publicProcedure
    .input(createClassInputSchema)
    .mutation(({ input }) => createClass(input)),
  
  getAllClasses: publicProcedure
    .query(() => getAllClasses()),
  
  getClassById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getClassById(input.id)),
  
  updateClass: publicProcedure
    .input(createClassInputSchema.partial().extend({ id: z.number() }))
    .mutation(({ input }) => {
      const { id, ...updateData } = input;
      return updateClass(id, updateData);
    }),
  
  deleteClass: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteClass(input.id)),

  // Transaction routes
  createTransaction: publicProcedure
    .input(createTransactionInputSchema.extend({ staffId: z.number() }))
    .mutation(({ input }) => {
      const { staffId, ...transactionInput } = input;
      return createTransaction(staffId, transactionInput);
    }),
  
  getTransactionsByStudent: publicProcedure
    .input(z.object({ studentId: z.number() }))
    .query(({ input }) => getTransactionsByStudent(input.studentId)),
  
  getTransactionsByStaff: publicProcedure
    .input(z.object({ staffId: z.number(), date: z.coerce.date().optional() }))
    .query(({ input }) => getTransactionsByStaff(input.staffId, input.date)),
  
  getTransactionsReport: publicProcedure
    .input(reportFiltersSchema)
    .query(({ input }) => getTransactionsReport(input)),
  
  getDailyTransactionSummary: publicProcedure
    .input(z.object({ date: z.coerce.date() }))
    .query(({ input }) => getDailyTransactionSummary(input.date)),

  // Dashboard routes
  getDashboardStats: publicProcedure
    .input(z.object({ userRole: userRoleSchema, userId: z.number().optional() }))
    .query(({ input }) => getDashboardStats(input.userRole, input.userId)),
  
  getStudentDashboard: publicProcedure
    .input(z.object({ studentId: z.number() }))
    .query(({ input }) => getStudentDashboard(input.studentId)),
  
  getStaffDashboard: publicProcedure
    .input(z.object({ staffId: z.number() }))
    .query(({ input }) => getStaffDashboard(input.staffId))
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Student Savings TRPC server listening at port: ${port}`);
}

start();
