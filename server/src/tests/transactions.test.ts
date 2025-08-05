
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  classesTable, 
  studentProfilesTable, 
  staffProfilesTable, 
  transactionsTable 
} from '../db/schema';
import { 
  createTransaction, 
  getTransactionsByStudent, 
  getTransactionsByStaff, 
  getTransactionsReport,
  getDailyTransactionSummary 
} from '../handlers/transactions';
import { 
  type CreateTransactionInput, 
  type ReportFilters 
} from '../schema';
import { eq } from 'drizzle-orm';

describe('Transaction Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testStudentId: number;
  let testStaffId: number;
  let testClassId: number;

  beforeEach(async () => {
    // Create test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        academic_year: '2024'
      })
      .returning()
      .execute();
    testClassId = classResult[0].id;

    // Create test student user
    const studentUserResult = await db.insert(usersTable)
      .values({
        username: 'student1',
        password_hash: 'hashed_password',
        role: 'STUDENT',
        full_name: 'Test Student',
        is_active: true,
        must_change_password: false
      })
      .returning()
      .execute();

    // Create student profile
    const studentProfileResult = await db.insert(studentProfilesTable)
      .values({
        user_id: studentUserResult[0].id,
        nis: 'NIS001',
        class_id: testClassId,
        current_balance: '100.00'
      })
      .returning()
      .execute();
    testStudentId = studentProfileResult[0].id;

    // Create test staff user
    const staffUserResult = await db.insert(usersTable)
      .values({
        username: 'staff1',
        password_hash: 'hashed_password',
        role: 'STAFF',
        full_name: 'Test Staff',
        is_active: true,
        must_change_password: false
      })
      .returning()
      .execute();

    // Create staff profile
    const staffProfileResult = await db.insert(staffProfilesTable)
      .values({
        user_id: staffUserResult[0].id,
        employee_id: 'EMP001'
      })
      .returning()
      .execute();
    testStaffId = staffProfileResult[0].id;
  });

  describe('createTransaction', () => {
    it('should create a deposit transaction', async () => {
      const input: CreateTransactionInput = {
        student_id: testStudentId,
        type: 'DEPOSIT',
        amount: 50.00,
        description: 'Test deposit'
      };

      const result = await createTransaction(testStaffId, input);

      expect(result.student_id).toEqual(testStudentId);
      expect(result.staff_id).toEqual(testStaffId);
      expect(result.type).toEqual('DEPOSIT');
      expect(result.amount).toEqual(50.00);
      expect(result.balance_before).toEqual(100.00);
      expect(result.balance_after).toEqual(150.00);
      expect(result.description).toEqual('Test deposit');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should create a withdrawal transaction', async () => {
      const input: CreateTransactionInput = {
        student_id: testStudentId,
        type: 'WITHDRAWAL',
        amount: 30.00,
        description: 'Test withdrawal'
      };

      const result = await createTransaction(testStaffId, input);

      expect(result.type).toEqual('WITHDRAWAL');
      expect(result.amount).toEqual(30.00);
      expect(result.balance_before).toEqual(100.00);
      expect(result.balance_after).toEqual(70.00);
    });

    it('should update student balance in database', async () => {
      const input: CreateTransactionInput = {
        student_id: testStudentId,
        type: 'DEPOSIT',
        amount: 25.00
      };

      await createTransaction(testStaffId, input);

      const students = await db.select()
        .from(studentProfilesTable)
        .where(eq(studentProfilesTable.id, testStudentId))
        .execute();

      expect(parseFloat(students[0].current_balance)).toEqual(125.00);
    });

    it('should reject withdrawal with insufficient balance', async () => {
      const input: CreateTransactionInput = {
        student_id: testStudentId,
        type: 'WITHDRAWAL',
        amount: 150.00
      };

      await expect(createTransaction(testStaffId, input)).rejects.toThrow(/insufficient balance/i);
    });

    it('should reject transaction for non-existent student', async () => {
      const input: CreateTransactionInput = {
        student_id: 99999,
        type: 'DEPOSIT',
        amount: 50.00
      };

      await expect(createTransaction(testStaffId, input)).rejects.toThrow(/student not found/i);
    });
  });

  describe('getTransactionsByStudent', () => {
    it('should return transactions for a student', async () => {
      // Create test transactions
      const input1: CreateTransactionInput = {
        student_id: testStudentId,
        type: 'DEPOSIT',
        amount: 50.00,
        description: 'First deposit'
      };

      const input2: CreateTransactionInput = {
        student_id: testStudentId,
        type: 'WITHDRAWAL',
        amount: 20.00,
        description: 'First withdrawal'
      };

      await createTransaction(testStaffId, input1);
      await createTransaction(testStaffId, input2);

      const results = await getTransactionsByStudent(testStudentId);

      expect(results).toHaveLength(2);
      expect(results[0].type).toEqual('WITHDRAWAL'); // Most recent first
      expect(results[0].amount).toEqual(20.00);
      expect(results[0].staff.user.full_name).toEqual('Test Staff');
      expect(results[1].type).toEqual('DEPOSIT');
      expect(results[1].amount).toEqual(50.00);
    });

    it('should return empty array for student with no transactions', async () => {
      const results = await getTransactionsByStudent(testStudentId);
      expect(results).toHaveLength(0);
    });
  });

  describe('getTransactionsByStaff', () => {
    it('should return all transactions by staff', async () => {
      const input: CreateTransactionInput = {
        student_id: testStudentId,
        type: 'DEPOSIT',
        amount: 50.00
      };

      await createTransaction(testStaffId, input);

      const results = await getTransactionsByStaff(testStaffId);

      expect(results).toHaveLength(1);
      expect(results[0].staff_id).toEqual(testStaffId);
      expect(results[0].student.user.full_name).toEqual('Test Student');
      expect(results[0].student.nis).toEqual('NIS001');
    });

    it('should filter transactions by date', async () => {
      const input: CreateTransactionInput = {
        student_id: testStudentId,
        type: 'DEPOSIT',
        amount: 50.00
      };

      await createTransaction(testStaffId, input);

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Should find transaction for today
      const todayResults = await getTransactionsByStaff(testStaffId, today);
      expect(todayResults).toHaveLength(1);

      // Should not find transaction for yesterday
      const yesterdayResults = await getTransactionsByStaff(testStaffId, yesterday);
      expect(yesterdayResults).toHaveLength(0);
    });
  });

  describe('getTransactionsReport', () => {
    it('should return filtered transactions report', async () => {
      const input: CreateTransactionInput = {
        student_id: testStudentId,
        type: 'DEPOSIT',
        amount: 75.00
      };

      await createTransaction(testStaffId, input);

      const filters: ReportFilters = {
        transaction_type: 'DEPOSIT'
      };

      const results = await getTransactionsReport(filters);

      expect(results).toHaveLength(1);
      expect(results[0].type).toEqual('DEPOSIT');
      expect(results[0].amount).toEqual(75.00);
      expect(results[0].student.user.full_name).toEqual('Test Student');
      expect(results[0].student.nis).toEqual('NIS001');
      expect(results[0].student.class.name).toEqual('Test Class');
      expect(results[0].staff.user.full_name).toEqual('Test Staff');
    });

    it('should filter by date range', async () => {
      const input: CreateTransactionInput = {
        student_id: testStudentId,
        type: 'DEPOSIT',
        amount: 50.00
      };

      await createTransaction(testStaffId, input);

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Use yesterday as start_date and today as end_date to ensure the transaction falls within range
      const filters: ReportFilters = {
        start_date: yesterday,
        end_date: today
      };

      const results = await getTransactionsReport(filters);
      expect(results).toHaveLength(1);
    });
  });

  describe('getDailyTransactionSummary', () => {
    it('should return daily transaction summary', async () => {
      // Create test transactions
      const deposit1: CreateTransactionInput = {
        student_id: testStudentId,
        type: 'DEPOSIT',
        amount: 100.00
      };

      const deposit2: CreateTransactionInput = {
        student_id: testStudentId,
        type: 'DEPOSIT',
        amount: 50.00
      };

      const withdrawal: CreateTransactionInput = {
        student_id: testStudentId,
        type: 'WITHDRAWAL',
        amount: 30.00
      };

      await createTransaction(testStaffId, deposit1);
      await createTransaction(testStaffId, deposit2);
      await createTransaction(testStaffId, withdrawal);

      const today = new Date();
      const summary = await getDailyTransactionSummary(today);

      expect(summary.total_transactions).toEqual(3);
      expect(summary.total_deposits).toEqual(2);
      expect(summary.total_withdrawals).toEqual(1);
      expect(summary.deposit_amount).toEqual(150.00);
      expect(summary.withdrawal_amount).toEqual(30.00);
    });

    it('should return zeros for day with no transactions', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const summary = await getDailyTransactionSummary(yesterday);

      expect(summary.total_transactions).toEqual(0);
      expect(summary.total_deposits).toEqual(0);
      expect(summary.total_withdrawals).toEqual(0);
      expect(summary.deposit_amount).toEqual(0);
      expect(summary.withdrawal_amount).toEqual(0);
    });
  });
});
