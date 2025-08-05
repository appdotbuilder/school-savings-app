
import { z } from 'zod';

// User role enum
export const userRoleSchema = z.enum(['ADMINISTRATOR', 'STAFF', 'STUDENT']);
export type UserRole = z.infer<typeof userRoleSchema>;

// Transaction type enum
export const transactionTypeSchema = z.enum(['DEPOSIT', 'WITHDRAWAL']);
export type TransactionType = z.infer<typeof transactionTypeSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  password_hash: z.string(),
  role: userRoleSchema,
  full_name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  is_active: z.boolean(),
  must_change_password: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Class/Group schema
export const classSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  academic_year: z.string(),
  created_at: z.coerce.date()
});

export type Class = z.infer<typeof classSchema>;

// Student profile schema
export const studentProfileSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  nis: z.string(), // Student number
  class_id: z.number(),
  parent_name: z.string().nullable(),
  parent_phone: z.string().nullable(),
  address: z.string().nullable(),
  current_balance: z.number(),
  created_at: z.coerce.date()
});

export type StudentProfile = z.infer<typeof studentProfileSchema>;

// Staff profile schema
export const staffProfileSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  employee_id: z.string(),
  department: z.string().nullable(),
  position: z.string().nullable(),
  created_at: z.coerce.date()
});

export type StaffProfile = z.infer<typeof staffProfileSchema>;

// Transaction schema
export const transactionSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  staff_id: z.number(),
  type: transactionTypeSchema,
  amount: z.number(),
  balance_before: z.number(),
  balance_after: z.number(),
  description: z.string().nullable(),
  transaction_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Transaction = z.infer<typeof transactionSchema>;

// Session schema for authentication
export const sessionSchema = z.object({
  id: z.string(),
  user_id: z.number(),
  expires_at: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Session = z.infer<typeof sessionSchema>;

// Input schemas

// Login input
export const loginInputSchema = z.object({
  username: z.string(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Create user input
export const createUserInputSchema = z.object({
  username: z.string(),
  password: z.string().optional(), // Optional for auto-generated passwords
  role: userRoleSchema,
  full_name: z.string(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Create student input
export const createStudentInputSchema = z.object({
  full_name: z.string(),
  nis: z.string(),
  class_id: z.number(),
  parent_name: z.string().nullable().optional(),
  parent_phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional()
});

export type CreateStudentInput = z.infer<typeof createStudentInputSchema>;

// Create staff input
export const createStaffInputSchema = z.object({
  username: z.string(),
  full_name: z.string(),
  employee_id: z.string(),
  department: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  password: z.string().optional()
});

export type CreateStaffInput = z.infer<typeof createStaffInputSchema>;

// Create class input
export const createClassInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  academic_year: z.string()
});

export type CreateClassInput = z.infer<typeof createClassInputSchema>;

// Create transaction input
export const createTransactionInputSchema = z.object({
  student_id: z.number(),
  type: transactionTypeSchema,
  amount: z.number().positive(),
  description: z.string().nullable().optional()
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

// Update password input
export const updatePasswordInputSchema = z.object({
  current_password: z.string(),
  new_password: z.string().min(6)
});

export type UpdatePasswordInput = z.infer<typeof updatePasswordInputSchema>;

// Reset password input (for administrators)
export const resetPasswordInputSchema = z.object({
  user_id: z.number(),
  new_password: z.string().min(6)
});

export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;

// Report filters
export const reportFiltersSchema = z.object({
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  student_id: z.number().optional(),
  class_id: z.number().optional(),
  transaction_type: transactionTypeSchema.optional()
});

export type ReportFilters = z.infer<typeof reportFiltersSchema>;

// Dashboard stats schema
export const dashboardStatsSchema = z.object({
  total_students: z.number(),
  total_staff: z.number(),
  total_balance: z.number(),
  total_transactions_today: z.number(),
  total_deposits_today: z.number(),
  total_withdrawals_today: z.number()
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
