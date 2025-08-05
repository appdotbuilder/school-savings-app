
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User, type UpdatePasswordInput, type ResetPasswordInput } from '../schema';
import { eq, SQL } from 'drizzle-orm';

// Simple password hashing using Bun's built-in crypto
const hashPassword = async (password: string): Promise<string> => {
  return await Bun.password.hash(password);
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await Bun.password.verify(password, hash);
};

// Generate a simple random password
const generatePassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export async function createUser(input: CreateUserInput): Promise<User> {
  try {
    // Generate password if not provided
    const password = input.password || generatePassword();
    const passwordHash = await hashPassword(password);

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        username: input.username,
        password_hash: passwordHash,
        role: input.role,
        full_name: input.full_name,
        email: input.email || null,
        phone: input.phone || null,
        is_active: true,
        must_change_password: input.password ? false : true // Auto-generated passwords require change
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const result = await db.select()
      .from(usersTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const result = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .execute();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
}

export async function updatePassword(userId: number, input: UpdatePasswordInput): Promise<{ success: boolean }> {
  try {
    // Get current user
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(input.current_password, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(input.new_password);

    // Update password
    await db.update(usersTable)
      .set({
        password_hash: newPasswordHash,
        must_change_password: false,
        updated_at: new Date()
      })
      .where(eq(usersTable.id, userId))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Password update failed:', error);
    throw error;
  }
}

export async function resetPassword(input: ResetPasswordInput): Promise<{ success: boolean }> {
  try {
    // Verify user exists
    const user = await getUserById(input.user_id);
    if (!user) {
      throw new Error('User not found');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(input.new_password);

    // Update password and require change
    await db.update(usersTable)
      .set({
        password_hash: newPasswordHash,
        must_change_password: true,
        updated_at: new Date()
      })
      .where(eq(usersTable.id, input.user_id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Password reset failed:', error);
    throw error;
  }
}

export async function toggleUserStatus(userId: number): Promise<{ success: boolean }> {
  try {
    // Get current user status
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Toggle status
    await db.update(usersTable)
      .set({
        is_active: !user.is_active,
        updated_at: new Date()
      })
      .where(eq(usersTable.id, userId))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Toggle user status failed:', error);
    throw error;
  }
}
