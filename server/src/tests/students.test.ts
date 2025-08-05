
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studentProfilesTable, classesTable } from '../db/schema';
import { type CreateStudentInput } from '../schema';
import { 
  createStudent, 
  getAllStudents, 
  getStudentById, 
  getStudentsByClass, 
  updateStudentBalance 
} from '../handlers/students';
import { eq } from 'drizzle-orm';

// Test data
const testClass = {
  name: 'Test Class 12A',
  description: 'Test class for students',
  academic_year: '2024/2025'
};

const testStudentInput: CreateStudentInput = {
  full_name: 'John Doe',
  nis: '12345',
  class_id: 1, // Will be set after class creation
  parent_name: 'Jane Doe',
  parent_phone: '081234567890',
  address: '123 Test Street',
  email: 'john.doe@test.com',
  phone: '081234567891'
};

describe('Student Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createStudent', () => {
    it('should create a student with user and profile', async () => {
      // Create class first
      const classResult = await db.insert(classesTable)
        .values(testClass)
        .returning()
        .execute();
      const createdClass = classResult[0];

      const input = { ...testStudentInput, class_id: createdClass.id };
      const result = await createStudent(input);

      // Verify user creation
      expect(result.user.username).toEqual('12345');
      expect(result.user.role).toEqual('STUDENT');
      expect(result.user.full_name).toEqual('John Doe');
      expect(result.user.email).toEqual('john.doe@test.com');
      expect(result.user.phone).toEqual('081234567891');
      expect(result.user.is_active).toBe(true);
      expect(result.user.must_change_password).toBe(true);
      expect(result.user.id).toBeDefined();

      // Verify profile creation
      expect(result.profile.user_id).toEqual(result.user.id);
      expect(result.profile.nis).toEqual('12345');
      expect(result.profile.class_id).toEqual(createdClass.id);
      expect(result.profile.parent_name).toEqual('Jane Doe');
      expect(result.profile.parent_phone).toEqual('081234567890');
      expect(result.profile.address).toEqual('123 Test Street');
      expect(result.profile.current_balance).toEqual(0);
      expect(typeof result.profile.current_balance).toBe('number');
      expect(result.profile.id).toBeDefined();
    });

    it('should save student data to database', async () => {
      // Create class first
      const classResult = await db.insert(classesTable)
        .values(testClass)
        .returning()
        .execute();
      const createdClass = classResult[0];

      const input = { ...testStudentInput, class_id: createdClass.id };
      const result = await createStudent(input);

      // Verify user in database
      const users = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, result.user.id))
        .execute();

      expect(users).toHaveLength(1);
      expect(users[0].username).toEqual('12345');
      expect(users[0].role).toEqual('STUDENT');

      // Verify profile in database
      const profiles = await db.select()
        .from(studentProfilesTable)
        .where(eq(studentProfilesTable.id, result.profile.id))
        .execute();

      expect(profiles).toHaveLength(1);
      expect(profiles[0].nis).toEqual('12345');
      expect(parseFloat(profiles[0].current_balance)).toEqual(0);
    });
  });

  describe('getAllStudents', () => {
    it('should return all students with user and class data', async () => {
      // Create class first
      const classResult = await db.insert(classesTable)
        .values(testClass)
        .returning()
        .execute();
      const createdClass = classResult[0];

      // Create student
      const input = { ...testStudentInput, class_id: createdClass.id };
      await createStudent(input);

      const results = await getAllStudents();

      expect(results).toHaveLength(1);
      expect(results[0].nis).toEqual('12345');
      expect(results[0].user.full_name).toEqual('John Doe');
      expect(results[0].class.name).toEqual('Test Class 12A');
      expect(typeof results[0].current_balance).toBe('number');
    });

    it('should return empty array when no students exist', async () => {
      const results = await getAllStudents();
      expect(results).toHaveLength(0);
    });
  });

  describe('getStudentById', () => {
    it('should return student with user and class data', async () => {
      // Create class first
      const classResult = await db.insert(classesTable)
        .values(testClass)
        .returning()
        .execute();
      const createdClass = classResult[0];

      // Create student
      const input = { ...testStudentInput, class_id: createdClass.id };
      const created = await createStudent(input);

      const result = await getStudentById(created.profile.id);

      expect(result).toBeDefined();
      expect(result!.nis).toEqual('12345');
      expect(result!.user.full_name).toEqual('John Doe');
      expect(result!.class.name).toEqual('Test Class 12A');
      expect(typeof result!.current_balance).toBe('number');
    });

    it('should return null for non-existent student', async () => {
      const result = await getStudentById(999);
      expect(result).toBeNull();
    });
  });

  describe('getStudentsByClass', () => {
    it('should return students in specific class', async () => {
      // Create class first
      const classResult = await db.insert(classesTable)
        .values(testClass)
        .returning()
        .execute();
      const createdClass = classResult[0];

      // Create student
      const input = { ...testStudentInput, class_id: createdClass.id };
      await createStudent(input);

      const results = await getStudentsByClass(createdClass.id);

      expect(results).toHaveLength(1);
      expect(results[0].nis).toEqual('12345');
      expect(results[0].user.full_name).toEqual('John Doe');
      expect(typeof results[0].current_balance).toBe('number');
    });

    it('should return empty array for class with no students', async () => {
      const results = await getStudentsByClass(999);
      expect(results).toHaveLength(0);
    });
  });

  describe('updateStudentBalance', () => {
    it('should update student balance', async () => {
      // Create class first
      const classResult = await db.insert(classesTable)
        .values(testClass)
        .returning()
        .execute();
      const createdClass = classResult[0];

      // Create student
      const input = { ...testStudentInput, class_id: createdClass.id };
      const created = await createStudent(input);

      const result = await updateStudentBalance(created.profile.id, 150.75);

      expect(result.success).toBe(true);

      // Verify balance was updated in database
      const profiles = await db.select()
        .from(studentProfilesTable)
        .where(eq(studentProfilesTable.id, created.profile.id))
        .execute();

      expect(parseFloat(profiles[0].current_balance)).toEqual(150.75);
    });

    it('should handle balance update for non-existent student', async () => {
      const result = await updateStudentBalance(999, 100);
      expect(result.success).toBe(true); // Update succeeds even if no rows affected
    });
  });
});
