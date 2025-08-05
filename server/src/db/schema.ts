
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['ADMINISTRATOR', 'STAFF', 'STUDENT']);
export const transactionTypeEnum = pgEnum('transaction_type', ['DEPOSIT', 'WITHDRAWAL']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull(),
  full_name: text('full_name').notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  is_active: boolean('is_active').notNull().default(true),
  must_change_password: boolean('must_change_password').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Classes table
export const classesTable = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  academic_year: varchar('academic_year', { length: 20 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Student profiles table
export const studentProfilesTable = pgTable('student_profiles', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  nis: varchar('nis', { length: 20 }).notNull().unique(),
  class_id: integer('class_id').references(() => classesTable.id).notNull(),
  parent_name: text('parent_name'),
  parent_phone: varchar('parent_phone', { length: 20 }),
  address: text('address'),
  current_balance: numeric('current_balance', { precision: 12, scale: 2 }).notNull().default('0.00'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Staff profiles table
export const staffProfilesTable = pgTable('staff_profiles', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  employee_id: varchar('employee_id', { length: 20 }).notNull().unique(),
  department: varchar('department', { length: 100 }),
  position: varchar('position', { length: 100 }),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Transactions table
export const transactionsTable = pgTable('transactions', {
  id: serial('id').primaryKey(),
  student_id: integer('student_id').references(() => studentProfilesTable.id).notNull(),
  staff_id: integer('staff_id').references(() => staffProfilesTable.id).notNull(),
  type: transactionTypeEnum('type').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  balance_before: numeric('balance_before', { precision: 12, scale: 2 }).notNull(),
  balance_after: numeric('balance_after', { precision: 12, scale: 2 }).notNull(),
  description: text('description'),
  transaction_date: timestamp('transaction_date').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Sessions table for authentication
export const sessionsTable = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ one }) => ({
  studentProfile: one(studentProfilesTable, {
    fields: [usersTable.id],
    references: [studentProfilesTable.user_id]
  }),
  staffProfile: one(staffProfilesTable, {
    fields: [usersTable.id],
    references: [staffProfilesTable.user_id]
  })
}));

export const classesRelations = relations(classesTable, ({ many }) => ({
  students: many(studentProfilesTable)
}));

export const studentProfilesRelations = relations(studentProfilesTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [studentProfilesTable.user_id],
    references: [usersTable.id]
  }),
  class: one(classesTable, {
    fields: [studentProfilesTable.class_id],
    references: [classesTable.id]
  }),
  transactions: many(transactionsTable)
}));

export const staffProfilesRelations = relations(staffProfilesTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [staffProfilesTable.user_id],
    references: [usersTable.id]
  }),
  transactions: many(transactionsTable)
}));

export const transactionsRelations = relations(transactionsTable, ({ one }) => ({
  student: one(studentProfilesTable, {
    fields: [transactionsTable.student_id],
    references: [studentProfilesTable.id]
  }),
  staff: one(staffProfilesTable, {
    fields: [transactionsTable.staff_id],
    references: [staffProfilesTable.id]
  })
}));

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionsTable.user_id],
    references: [usersTable.id]
  })
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  classes: classesTable,
  studentProfiles: studentProfilesTable,
  staffProfiles: staffProfilesTable,
  transactions: transactionsTable,
  sessions: sessionsTable
};
