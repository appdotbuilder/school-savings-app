
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type UpdatePasswordInput, type ResetPasswordInput } from '../schema';
import { 
  createUser, 
  getAllUsers, 
  getUserById, 
  updatePassword, 
  resetPassword, 
  toggleUserStatus 
} from '../handlers/users';
import { eq } from 'drizzle-orm';

// Test inputs
const testUserInput: CreateUserInput = {
  username: 'testuser',
  password: 'testpass123',
  role: 'STAFF',
  full_name: 'Test User',
  email: 'test@example.com',
  phone: '+1234567890'
};

const testStudentInput: CreateUserInput = {
  username: 'student1',
  role: 'STUDENT',
  full_name: 'Student One',
  email: null,
  phone: null
};

const testAdminInput: CreateUserInput = {
  username: 'admin',
  password: 'admin123',
  role: 'ADMINISTRATOR',
  full_name: 'Administrator',
  email: 'admin@school.com',
  phone: null
};

describe('User Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createUser', () => {
    it('should create a user with provided password', async () => {
      const result = await createUser(testUserInput);

      expect(result.username).toEqual('testuser');
      expect(result.role).toEqual('STAFF');
      expect(result.full_name).toEqual('Test User');
      expect(result.email).toEqual('test@example.com');
      expect(result.phone).toEqual('+1234567890');
      expect(result.is_active).toBe(true);
      expect(result.must_change_password).toBe(false);
      expect(result.id).toBeDefined();
      expect(result.password_hash).toBeDefined();
      expect(result.password_hash).not.toEqual('testpass123'); // Should be hashed
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create a user with auto-generated password', async () => {
      const result = await createUser(testStudentInput);

      expect(result.username).toEqual('student1');
      expect(result.role).toEqual('STUDENT');
      expect(result.full_name).toEqual('Student One');
      expect(result.email).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.is_active).toBe(true);
      expect(result.must_change_password).toBe(true); // Auto-generated password
      expect(result.password_hash).toBeDefined();
    });

    it('should save user to database', async () => {
      const result = await createUser(testUserInput);

      const users = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, result.id))
        .execute();

      expect(users).toHaveLength(1);
      expect(users[0].username).toEqual('testuser');
      expect(users[0].full_name).toEqual('Test User');
      expect(users[0].is_active).toBe(true);
    });

    it('should enforce unique username constraint', async () => {
      await createUser(testUserInput);

      await expect(createUser(testUserInput)).rejects.toThrow();
    });
  });

  describe('getAllUsers', () => {
    it('should return empty array when no users exist', async () => {
      const result = await getAllUsers();
      expect(result).toEqual([]);
    });

    it('should return all users', async () => {
      await createUser(testUserInput);
      await createUser(testStudentInput);
      await createUser(testAdminInput);

      const result = await getAllUsers();
      expect(result).toHaveLength(3);
      
      const usernames = result.map(user => user.username);
      expect(usernames).toContain('testuser');
      expect(usernames).toContain('student1');
      expect(usernames).toContain('admin');
    });
  });

  describe('getUserById', () => {
    it('should return null for non-existent user', async () => {
      const result = await getUserById(999);
      expect(result).toBeNull();
    });

    it('should return user by ID', async () => {
      const created = await createUser(testUserInput);
      const result = await getUserById(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.username).toEqual('testuser');
      expect(result!.full_name).toEqual('Test User');
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      const user = await createUser(testUserInput);
      
      const updateInput: UpdatePasswordInput = {
        current_password: 'testpass123',
        new_password: 'newpass456'
      };

      const result = await updatePassword(user.id, updateInput);
      expect(result.success).toBe(true);

      // Verify password was updated in database
      const updatedUser = await getUserById(user.id);
      expect(updatedUser!.password_hash).not.toEqual(user.password_hash);
      expect(updatedUser!.must_change_password).toBe(false);
    });

    it('should fail with incorrect current password', async () => {
      const user = await createUser(testUserInput);
      
      const updateInput: UpdatePasswordInput = {
        current_password: 'wrongpassword',
        new_password: 'newpass456'
      };

      await expect(updatePassword(user.id, updateInput))
        .rejects.toThrow(/current password is incorrect/i);
    });

    it('should fail for non-existent user', async () => {
      const updateInput: UpdatePasswordInput = {
        current_password: 'testpass123',
        new_password: 'newpass456'
      };

      await expect(updatePassword(999, updateInput))
        .rejects.toThrow(/user not found/i);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const user = await createUser(testUserInput);
      
      const resetInput: ResetPasswordInput = {
        user_id: user.id,
        new_password: 'resetpass123'
      };

      const result = await resetPassword(resetInput);
      expect(result.success).toBe(true);

      // Verify password was reset in database
      const updatedUser = await getUserById(user.id);
      expect(updatedUser!.password_hash).not.toEqual(user.password_hash);
      expect(updatedUser!.must_change_password).toBe(true);
    });

    it('should fail for non-existent user', async () => {
      const resetInput: ResetPasswordInput = {
        user_id: 999,
        new_password: 'resetpass123'
      };

      await expect(resetPassword(resetInput))
        .rejects.toThrow(/user not found/i);
    });
  });

  describe('toggleUserStatus', () => {
    it('should toggle user status from active to inactive', async () => {
      const user = await createUser(testUserInput);
      expect(user.is_active).toBe(true);

      const result = await toggleUserStatus(user.id);
      expect(result.success).toBe(true);

      const updatedUser = await getUserById(user.id);
      expect(updatedUser!.is_active).toBe(false);
    });

    it('should toggle user status from inactive to active', async () => {
      const user = await createUser(testUserInput);
      
      // First toggle to inactive
      await toggleUserStatus(user.id);
      let updatedUser = await getUserById(user.id);
      expect(updatedUser!.is_active).toBe(false);

      // Then toggle back to active
      await toggleUserStatus(user.id);
      updatedUser = await getUserById(user.id);
      expect(updatedUser!.is_active).toBe(true);
    });

    it('should fail for non-existent user', async () => {
      await expect(toggleUserStatus(999))
        .rejects.toThrow(/user not found/i);
    });
  });
});
