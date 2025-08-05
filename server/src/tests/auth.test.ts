
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, sessionsTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { login, logout, validateSession } from '../handlers/auth';
import { eq } from 'drizzle-orm';

describe('auth handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('login', () => {
    const testPassword = 'testpassword123';
    let testUser: any;

    beforeEach(async () => {
      // Create test user with hashed password
      const hashedPassword = await Bun.password.hash(testPassword);
      const users = await db.insert(usersTable)
        .values({
          username: 'testuser',
          password_hash: hashedPassword,
          role: 'STUDENT',
          full_name: 'Test User',
          email: 'test@example.com',
          phone: '123456789',
          is_active: true,
          must_change_password: false
        })
        .returning()
        .execute();
      
      testUser = users[0];
    });

    it('should authenticate valid user and create session', async () => {
      const input: LoginInput = {
        username: 'testuser',
        password: testPassword
      };

      const result = await login(input);

      // Verify user data
      expect(result.user.id).toEqual(testUser.id);
      expect(result.user.username).toEqual('testuser');
      expect(result.user.role).toEqual('STUDENT');
      expect(result.user.full_name).toEqual('Test User');
      expect(result.user.email).toEqual('test@example.com');
      expect(result.user.is_active).toBe(true);
      expect(result.user.created_at).toBeInstanceOf(Date);
      expect(result.user.updated_at).toBeInstanceOf(Date);

      // Verify session data
      expect(result.session.id).toBeDefined();
      expect(result.session.user_id).toEqual(testUser.id);
      expect(result.session.expires_at).toBeInstanceOf(Date);
      expect(result.session.created_at).toBeInstanceOf(Date);
      expect(result.session.expires_at.getTime()).toBeGreaterThan(Date.now());
    });

    it('should save session to database', async () => {
      const input: LoginInput = {
        username: 'testuser',
        password: testPassword
      };

      const result = await login(input);

      // Verify session exists in database
      const sessions = await db.select()
        .from(sessionsTable)
        .where(eq(sessionsTable.id, result.session.id))
        .execute();

      expect(sessions).toHaveLength(1);
      expect(sessions[0].user_id).toEqual(testUser.id);
      expect(sessions[0].expires_at).toBeInstanceOf(Date);
    });

    it('should reject invalid username', async () => {
      const input: LoginInput = {
        username: 'nonexistent',
        password: testPassword
      };

      await expect(login(input)).rejects.toThrow(/invalid username or password/i);
    });

    it('should reject invalid password', async () => {
      const input: LoginInput = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      await expect(login(input)).rejects.toThrow(/invalid username or password/i);
    });

    it('should reject inactive user', async () => {
      // Deactivate user
      await db.update(usersTable)
        .set({ is_active: false })
        .where(eq(usersTable.id, testUser.id))
        .execute();

      const input: LoginInput = {
        username: 'testuser',
        password: testPassword
      };

      await expect(login(input)).rejects.toThrow(/account is inactive/i);
    });
  });

  describe('logout', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Create test user and session
      const hashedPassword = await Bun.password.hash('testpassword');
      const users = await db.insert(usersTable)
        .values({
          username: 'testuser',
          password_hash: hashedPassword,
          role: 'STAFF',
          full_name: 'Test User',
          is_active: true,
          must_change_password: false
        })
        .returning()
        .execute();

      const sessions = await db.insert(sessionsTable)
        .values({
          id: crypto.randomUUID(),
          user_id: users[0].id,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
        })
        .returning()
        .execute();

      sessionId = sessions[0].id;
    });

    it('should successfully logout and remove session', async () => {
      const result = await logout(sessionId);

      expect(result.success).toBe(true);

      // Verify session was removed from database
      const sessions = await db.select()
        .from(sessionsTable)
        .where(eq(sessionsTable.id, sessionId))
        .execute();

      expect(sessions).toHaveLength(0);
    });

    it('should succeed even with non-existent session', async () => {
      const result = await logout('non-existent-session');

      expect(result.success).toBe(true);
    });
  });

  describe('validateSession', () => {
    let testUser: any;
    let validSessionId: string;
    let expiredSessionId: string;

    beforeEach(async () => {
      // Create test user
      const hashedPassword = await Bun.password.hash('testpassword');
      const users = await db.insert(usersTable)
        .values({
          username: 'testuser',
          password_hash: hashedPassword,
          role: 'ADMINISTRATOR',
          full_name: 'Test Admin',
          email: 'admin@example.com',
          is_active: true,
          must_change_password: false
        })
        .returning()
        .execute();

      testUser = users[0];

      // Create valid session
      const validSession = await db.insert(sessionsTable)
        .values({
          id: crypto.randomUUID(),
          user_id: testUser.id,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
        })
        .returning()
        .execute();

      validSessionId = validSession[0].id;

      // Create expired session
      const expiredSession = await db.insert(sessionsTable)
        .values({
          id: crypto.randomUUID(),
          user_id: testUser.id,
          expires_at: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
        })
        .returning()
        .execute();

      expiredSessionId = expiredSession[0].id;
    });

    it('should return user for valid session', async () => {
      const user = await validateSession(validSessionId);

      expect(user).not.toBeNull();
      expect(user!.id).toEqual(testUser.id);
      expect(user!.username).toEqual('testuser');
      expect(user!.role).toEqual('ADMINISTRATOR');
      expect(user!.full_name).toEqual('Test Admin');
      expect(user!.email).toEqual('admin@example.com');
      expect(user!.is_active).toBe(true);
      expect(user!.created_at).toBeInstanceOf(Date);
      expect(user!.updated_at).toBeInstanceOf(Date);
    });

    it('should return null for expired session', async () => {
      const user = await validateSession(expiredSessionId);

      expect(user).toBeNull();
    });

    it('should return null for non-existent session', async () => {
      const user = await validateSession('non-existent-session');

      expect(user).toBeNull();
    });

    it('should return null for inactive user', async () => {
      // Deactivate user
      await db.update(usersTable)
        .set({ is_active: false })
        .where(eq(usersTable.id, testUser.id))
        .execute();

      const user = await validateSession(validSessionId);

      expect(user).toBeNull();
    });
  });
});
