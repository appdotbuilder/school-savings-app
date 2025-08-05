
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, usersTable, studentProfilesTable } from '../db/schema';
import { type CreateClassInput } from '../schema';
import { 
  createClass, 
  getAllClasses, 
  getClassById, 
  updateClass, 
  deleteClass 
} from '../handlers/classes';
import { eq } from 'drizzle-orm';

const testClassInput: CreateClassInput = {
  name: 'Test Class 10A',
  description: 'A test class for grade 10',
  academic_year: '2024/2025'
};

const minimalClassInput: CreateClassInput = {
  name: 'Minimal Class',
  academic_year: '2024/2025'
};

describe('Classes handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createClass', () => {
    it('should create a class with all fields', async () => {
      const result = await createClass(testClassInput);

      expect(result.name).toEqual('Test Class 10A');
      expect(result.description).toEqual('A test class for grade 10');
      expect(result.academic_year).toEqual('2024/2025');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should create a class with minimal fields', async () => {
      const result = await createClass(minimalClassInput);

      expect(result.name).toEqual('Minimal Class');
      expect(result.description).toBeNull();
      expect(result.academic_year).toEqual('2024/2025');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should save class to database', async () => {
      const result = await createClass(testClassInput);

      const classes = await db.select()
        .from(classesTable)
        .where(eq(classesTable.id, result.id))
        .execute();

      expect(classes).toHaveLength(1);
      expect(classes[0].name).toEqual('Test Class 10A');
      expect(classes[0].description).toEqual('A test class for grade 10');
      expect(classes[0].academic_year).toEqual('2024/2025');
    });
  });

  describe('getAllClasses', () => {
    it('should return empty array when no classes exist', async () => {
      const result = await getAllClasses();
      expect(result).toEqual([]);
    });

    it('should return all classes', async () => {
      await createClass(testClassInput);
      await createClass(minimalClassInput);

      const result = await getAllClasses();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBeDefined();
      expect(result[1].name).toBeDefined();
    });

    it('should return classes ordered by academic year and name', async () => {
      await createClass({ ...testClassInput, academic_year: '2025/2026', name: 'Class B' });
      await createClass({ ...testClassInput, academic_year: '2024/2025', name: 'Class A' });

      const result = await getAllClasses();

      expect(result).toHaveLength(2);
      expect(result[0].academic_year).toEqual('2024/2025');
      expect(result[1].academic_year).toEqual('2025/2026');
    });
  });

  describe('getClassById', () => {
    it('should return null for non-existent class', async () => {
      const result = await getClassById(999);
      expect(result).toBeNull();
    });

    it('should return class by ID', async () => {
      const created = await createClass(testClassInput);
      const result = await getClassById(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.name).toEqual('Test Class 10A');
      expect(result!.description).toEqual('A test class for grade 10');
    });
  });

  describe('updateClass', () => {
    it('should return null for non-existent class', async () => {
      const result = await updateClass(999, { name: 'Updated Name' });
      expect(result).toBeNull();
    });

    it('should update class name', async () => {
      const created = await createClass(testClassInput);
      const result = await updateClass(created.id, { name: 'Updated Class Name' });

      expect(result).not.toBeNull();
      expect(result!.name).toEqual('Updated Class Name');
      expect(result!.description).toEqual('A test class for grade 10');
      expect(result!.academic_year).toEqual('2024/2025');
    });

    it('should update multiple fields', async () => {
      const created = await createClass(testClassInput);
      const result = await updateClass(created.id, {
        name: 'New Name',
        description: 'New description',
        academic_year: '2025/2026'
      });

      expect(result).not.toBeNull();
      expect(result!.name).toEqual('New Name');
      expect(result!.description).toEqual('New description');
      expect(result!.academic_year).toEqual('2025/2026');
    });

    it('should return current class when no fields provided', async () => {
      const created = await createClass(testClassInput);
      const result = await updateClass(created.id, {});

      expect(result).not.toBeNull();
      expect(result!.name).toEqual('Test Class 10A');
      expect(result!.description).toEqual('A test class for grade 10');
    });

    it('should save updates to database', async () => {
      const created = await createClass(testClassInput);
      await updateClass(created.id, { name: 'Database Test' });

      const classes = await db.select()
        .from(classesTable)
        .where(eq(classesTable.id, created.id))
        .execute();

      expect(classes[0].name).toEqual('Database Test');
    });
  });

  describe('deleteClass', () => {
    it('should return false for non-existent class', async () => {
      const result = await deleteClass(999);
      expect(result.success).toBe(false);
    });

    it('should delete class successfully', async () => {
      const created = await createClass(testClassInput);
      const result = await deleteClass(created.id);

      expect(result.success).toBe(true);

      const classes = await db.select()
        .from(classesTable)
        .where(eq(classesTable.id, created.id))
        .execute();

      expect(classes).toHaveLength(0);
    });

    it('should prevent deletion of class with assigned students', async () => {
      // Create class
      const createdClass = await createClass(testClassInput);

      // Create user for student
      const userResult = await db.insert(usersTable)
        .values({
          username: 'testuser',
          password_hash: 'hashedpass',
          role: 'STUDENT',
          full_name: 'Test User'
        })
        .returning()
        .execute();

      // Create student profile assigned to the class
      await db.insert(studentProfilesTable)
        .values({
          user_id: userResult[0].id,
          nis: 'TEST001',
          class_id: createdClass.id,
          current_balance: '0.00'
        })
        .execute();

      // Attempt to delete class should throw error
      await expect(deleteClass(createdClass.id)).rejects.toThrow(/Cannot delete class with assigned students/i);
    });
  });
});
