
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  studentProfilesTable, 
  staffProfilesTable, 
  transactionsTable,
  classesTable
} from '../db/schema';
import { getDashboardStats, getStudentDashboard, getStaffDashboard } from '../handlers/dashboard';

describe('Dashboard Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('getDashboardStats', () => {
    it('should return global stats for administrator', async () => {
      // Create test data
      const [adminUser] = await db.insert(usersTable).values({
        username: 'admin',
        password_hash: 'hash',
        role: 'ADMINISTRATOR',
        full_name: 'Admin User'
      }).returning().execute();

      const [testClass] = await db.insert(classesTable).values({
        name: 'Class A',
        academic_year: '2024'
      }).returning().execute();

      const [studentUser] = await db.insert(usersTable).values({
        username: 'student1',
        password_hash: 'hash',
        role: 'STUDENT',
        full_name: 'Student One'
      }).returning().execute();

      const [staffUser] = await db.insert(usersTable).values({
        username: 'staff1',
        password_hash: 'hash',
        role: 'STAFF',
        full_name: 'Staff One'
      }).returning().execute();

      const [studentProfile] = await db.insert(studentProfilesTable).values({
        user_id: studentUser.id,
        nis: 'NIS001',
        class_id: testClass.id,
        current_balance: '100.50'
      }).returning().execute();

      const [staffProfile] = await db.insert(staffProfilesTable).values({
        user_id: staffUser.id,
        employee_id: 'EMP001'
      }).returning().execute();

      await db.insert(transactionsTable).values({
        student_id: studentProfile.id,
        staff_id: staffProfile.id,
        type: 'DEPOSIT',
        amount: '50.00',
        balance_before: '50.50',
        balance_after: '100.50'
      }).execute();

      const result = await getDashboardStats('ADMINISTRATOR', adminUser.id);

      expect(result.total_students).toBe(1);
      expect(result.total_staff).toBe(1);
      expect(result.total_balance).toBe(100.5);
      expect(result.total_transactions_today).toBe(1);
      expect(result.total_deposits_today).toBe(1);
      expect(result.total_withdrawals_today).toBe(0);
    });

    it('should return staff-specific stats for staff role', async () => {
      // Create test data
      const [staffUser] = await db.insert(usersTable).values({
        username: 'staff1',
        password_hash: 'hash',
        role: 'STAFF',
        full_name: 'Staff One'
      }).returning().execute();

      const [testClass] = await db.insert(classesTable).values({
        name: 'Class A',
        academic_year: '2024'
      }).returning().execute();

      const [studentUser] = await db.insert(usersTable).values({
        username: 'student1',
        password_hash: 'hash',
        role: 'STUDENT',
        full_name: 'Student One'
      }).returning().execute();

      const [studentProfile] = await db.insert(studentProfilesTable).values({
        user_id: studentUser.id,
        nis: 'NIS001',
        class_id: testClass.id,
        current_balance: '100.00'
      }).returning().execute();

      const [staffProfile] = await db.insert(staffProfilesTable).values({
        user_id: staffUser.id,
        employee_id: 'EMP001'
      }).returning().execute();

      await db.insert(transactionsTable).values({
        student_id: studentProfile.id,
        staff_id: staffProfile.id,
        type: 'DEPOSIT',
        amount: '25.00',
        balance_before: '75.00',
        balance_after: '100.00'
      }).execute();

      const result = await getDashboardStats('STAFF', staffUser.id);

      expect(result.total_students).toBe(0);
      expect(result.total_staff).toBe(0);
      expect(result.total_balance).toBe(0);
      expect(result.total_transactions_today).toBe(1);
      expect(result.total_deposits_today).toBe(1);
      expect(result.total_withdrawals_today).toBe(0);
    });

    it('should return zero stats for student role', async () => {
      const result = await getDashboardStats('STUDENT', 1);

      expect(result.total_students).toBe(0);
      expect(result.total_staff).toBe(0);
      expect(result.total_balance).toBe(0);
      expect(result.total_transactions_today).toBe(0);
      expect(result.total_deposits_today).toBe(0);
      expect(result.total_withdrawals_today).toBe(0);
    });

    it('should throw error when staff profile not found', async () => {
      expect(getDashboardStats('STAFF', 999)).rejects.toThrow(/staff profile not found/i);
    });
  });

  describe('getStudentDashboard', () => {
    it('should return student dashboard data', async () => {
      // Create test data
      const [testClass] = await db.insert(classesTable).values({
        name: 'Class A',
        academic_year: '2024'
      }).returning().execute();

      const [studentUser] = await db.insert(usersTable).values({
        username: 'student1',
        password_hash: 'hash',
        role: 'STUDENT',
        full_name: 'Student One'
      }).returning().execute();

      const [staffUser] = await db.insert(usersTable).values({
        username: 'staff1',
        password_hash: 'hash',
        role: 'STAFF',
        full_name: 'Staff One'
      }).returning().execute();

      const [studentProfile] = await db.insert(studentProfilesTable).values({
        user_id: studentUser.id,
        nis: 'NIS001',
        class_id: testClass.id,
        current_balance: '150.75'
      }).returning().execute();

      const [staffProfile] = await db.insert(staffProfilesTable).values({
        user_id: staffUser.id,
        employee_id: 'EMP001'
      }).returning().execute();

      await db.insert(transactionsTable).values({
        student_id: studentProfile.id,
        staff_id: staffProfile.id,
        type: 'DEPOSIT',
        amount: '50.75',
        balance_before: '100.00',
        balance_after: '150.75',
        description: 'Test deposit'
      }).execute();

      const result = await getStudentDashboard(studentProfile.id);

      expect(result.current_balance).toBe(150.75);
      expect(result.recent_transactions).toHaveLength(1);
      expect(result.recent_transactions[0].type).toBe('DEPOSIT');
      expect(result.recent_transactions[0].amount).toBe(50.75);
      expect(result.recent_transactions[0].staff_name).toBe('Staff One');
      expect(result.assigned_staff).toBeNull();
    });

    it('should throw error when student profile not found', async () => {
      expect(getStudentDashboard(999)).rejects.toThrow(/student profile not found/i);
    });
  });

  describe('getStaffDashboard', () => {
    it('should return staff dashboard data', async () => {
      // Create test data
      const [testClass] = await db.insert(classesTable).values({
        name: 'Class A',
        academic_year: '2024'
      }).returning().execute();

      const [studentUser] = await db.insert(usersTable).values({
        username: 'student1',
        password_hash: 'hash',
        role: 'STUDENT',
        full_name: 'Student One'
      }).returning().execute();

      const [staffUser] = await db.insert(usersTable).values({
        username: 'staff1',
        password_hash: 'hash',
        role: 'STAFF',
        full_name: 'Staff One'
      }).returning().execute();

      const [studentProfile] = await db.insert(studentProfilesTable).values({
        user_id: studentUser.id,
        nis: 'NIS001',
        class_id: testClass.id,
        current_balance: '200.00'
      }).returning().execute();

      const [staffProfile] = await db.insert(staffProfilesTable).values({
        user_id: staffUser.id,
        employee_id: 'EMP001'
      }).returning().execute();

      await db.insert(transactionsTable).values({
        student_id: studentProfile.id,
        staff_id: staffProfile.id,
        type: 'WITHDRAWAL',
        amount: '25.00',
        balance_before: '225.00',
        balance_after: '200.00'
      }).execute();

      const result = await getStaffDashboard(staffProfile.id);

      expect(result.students_count).toBe(1);
      expect(result.total_balance_managed).toBe(200.00);
      expect(result.transactions_today).toBe(1);
      expect(result.recent_students).toHaveLength(1);
      expect(result.recent_students[0].student_name).toBe('Student One');
      expect(result.recent_students[0].nis).toBe('NIS001');
      expect(result.recent_students[0].current_balance).toBe(200.00);
      expect(result.recent_students[0].class_name).toBe('Class A');
    });
  });
});
