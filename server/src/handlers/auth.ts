
import { db } from '../db';
import { usersTable, sessionsTable, studentProfilesTable, staffProfilesTable } from '../db/schema';
import { type LoginInput, type User, type Session } from '../schema';
import { eq, and, gt } from 'drizzle-orm';

export async function login(input: LoginInput): Promise<{ user: User; session: Session }> {
  try {
    // Find user by username
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, input.username))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid username or password');
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is inactive');
    }

    // Verify password (in real app, use bcrypt.compare)
    // For now, simple comparison - in production use proper password hashing
    const passwordMatches = await Bun.password.verify(input.password, user.password_hash);
    if (!passwordMatches) {
      throw new Error('Invalid username or password');
    }

    // Generate session ID and expiration
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create session
    const sessionResult = await db.insert(sessionsTable)
      .values({
        id: sessionId,
        user_id: user.id,
        expires_at: expiresAt
      })
      .returning()
      .execute();

    const session = sessionResult[0];

    return {
      user: {
        ...user,
        created_at: new Date(user.created_at),
        updated_at: new Date(user.updated_at)
      },
      session: {
        ...session,
        expires_at: new Date(session.expires_at),
        created_at: new Date(session.created_at)
      }
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

export async function logout(sessionId: string): Promise<{ success: boolean }> {
  try {
    // Delete the session from database
    const result = await db.delete(sessionsTable)
      .where(eq(sessionsTable.id, sessionId))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
}

export async function validateSession(sessionId: string): Promise<User | null> {
  try {
    const now = new Date();

    // Find valid session with user data
    const results = await db.select({
      user: usersTable,
      session: sessionsTable
    })
      .from(sessionsTable)
      .innerJoin(usersTable, eq(sessionsTable.user_id, usersTable.id))
      .where(
        and(
          eq(sessionsTable.id, sessionId),
          gt(sessionsTable.expires_at, now)
        )
      )
      .execute();

    if (results.length === 0) {
      return null;
    }

    const result = results[0];
    const user = result.user;

    // Check if user is still active
    if (!user.is_active) {
      return null;
    }

    return {
      ...user,
      created_at: new Date(user.created_at),
      updated_at: new Date(user.updated_at)
    };
  } catch (error) {
    console.error('Session validation failed:', error);
    return null;
  }
}
