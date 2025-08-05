
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, staffProfilesTable } from '../db/schema';
import { type CreateStaffInput } from '../schema';
import { createStaff, getAllStaff, getStaffById } from '../handlers/staff';
import { eq } from 'drizzle-orm';

const testInput: CreateStaffInput = {
  username: 'test_staff',
  full_name: 'Test Staff Member',
  employee_id: 'EMP001',
  department: 'Administration',
  position: 'Assistant',
  email: 'test@school.com',
  phone: '081234567890',
  password: 'testpass123'
};

describe('staff handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createStaff', () => {
    it('should create staff with user and profile', async () => {
      const result = await createStaff(testInput);

      // Validate user fields
      expect(result.user.username).toEqual('test_staff');
      expect(result.user.full_name).toEqual('Test Staff Member');
      expect(result.user.role).toEqual('STAFF');
      expect(result.user.email).toEqual('test@school.com');
      expect(result.user.phone).toEqual('081234567890');
      expect(result.user.is_active).toBe(true);
      expect(result.user.must_change_password).toBe(false);
      expect(result.user.id).toBeDefined();
      expect(result.user.created_at).toBeInstanceOf(Date);

      // Validate profile fields
      expect(result.profile.user_id).toEqual(result.user.id);
      expect(result.profile.employee_id).toEqual('EMP001');
      expect(result.profile.department).toEqual('Administration');
      expect(result.profile.position).toEqual('Assistant');
      expect(result.profile.id).toBeDefined();
      expect(result.profile.created_at).toBeInstanceOf(Date);
    });

    it('should auto-generate password when not provided', async () => {
      const inputWithoutPassword: CreateStaffInput = {
        username: 'auto_staff',
        full_name: 'Auto Staff',
        employee_id: 'EMP002',
        department: 'IT',
        position: 'Technician'
      };

      const result = await createStaff(inputWithoutPassword);

      expect(result.user.username).toEqual('auto_staff');
      expect(result.user.must_change_password).toBe(true);
      expect(result.user.password_hash).toBeDefined();
      expect(result.user.password_hash.length).toBeGreaterThan(0);
    });

    it('should save staff data to database', async () => {
      const result = await createStaff(testInput);

      // Check user in database
      const users = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, result.user.id))
        .execute();

      expect(users).toHaveLength(1);
      expect(users[0].username).toEqual('test_staff');
      expect(users[0].role).toEqual('STAFF');

      // Check profile in database
      const profiles = await db.select()
        .from(staffProfilesTable)
        .where(eq(staffProfilesTable.id, result.profile.id))
        .execute();

      expect(profiles).toHaveLength(1);
      expect(profiles[0].employee_id).toEqual('EMP001');
      expect(profiles[0].user_id).toEqual(result.user.id);
    });

    it('should handle nullable fields correctly', async () => {
      const minimalInput: CreateStaffInput = {
        username: 'minimal_staff',
        full_name: 'Minimal Staff',
        employee_id: 'EMP003'
      };

      const result = await createStaff(minimalInput);

      expect(result.user.email).toBeNull();
      expect(result.user.phone).toBeNull();
      expect(result.profile.department).toBeNull();
      expect(result.profile.position).toBeNull();
    });
  });

  describe('getAllStaff', () => {
    it('should return empty array when no staff exists', async () => {
      const result = await getAllStaff();
      expect(result).toEqual([]);
    });

    it('should return all staff with user data', async () => {
      // Create test staff
      await createStaff(testInput);
      await createStaff({
        username: 'staff2',
        full_name: 'Staff Two',
        employee_id: 'EMP002',
        department: 'Finance'
      });

      const result = await getAllStaff();

      expect(result).toHaveLength(2);
      
      // Check first staff
      const staff1 = result.find(s => s.employee_id === 'EMP001');
      expect(staff1).toBeDefined();
      expect(staff1!.user.username).toEqual('test_staff');
      expect(staff1!.user.role).toEqual('STAFF');
      expect(staff1!.department).toEqual('Administration');

      // Check second staff
      const staff2 = result.find(s => s.employee_id === 'EMP002');
      expect(staff2).toBeDefined();
      expect(staff2!.user.username).toEqual('staff2');
      expect(staff2!.department).toEqual('Finance');
    });
  });

  describe('getStaffById', () => {
    it('should return null when staff not found', async () => {
      const result = await getStaffById(999);
      expect(result).toBeNull();
    });

    it('should return staff with user data when found', async () => {
      const created = await createStaff(testInput);
      
      const result = await getStaffById(created.profile.id);

      expect(result).toBeDefined();
      expect(result!.id).toEqual(created.profile.id);
      expect(result!.employee_id).toEqual('EMP001');
      expect(result!.department).toEqual('Administration');
      expect(result!.position).toEqual('Assistant');
      expect(result!.user.username).toEqual('test_staff');
      expect(result!.user.full_name).toEqual('Test Staff Member');
      expect(result!.user.role).toEqual('STAFF');
    });
  });
});
