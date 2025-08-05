
import { db } from '../db';
import { usersTable, staffProfilesTable } from '../db/schema';
import { type CreateStaffInput, type StaffProfile, type User } from '../schema';
import { eq } from 'drizzle-orm';

export async function createStaff(input: CreateStaffInput): Promise<{ user: User; profile: StaffProfile }> {
  try {
    // Generate password if not provided
    const password = input.password || Math.random().toString(36).slice(-8);
    const passwordHash = await Bun.password.hash(password);

    // Insert user record
    const userResult = await db.insert(usersTable)
      .values({
        username: input.username,
        password_hash: passwordHash,
        role: 'STAFF',
        full_name: input.full_name,
        email: input.email ?? null,
        phone: input.phone ?? null,
        is_active: true,
        must_change_password: !input.password // Force password change if auto-generated
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Insert staff profile record
    const profileResult = await db.insert(staffProfilesTable)
      .values({
        user_id: user.id,
        employee_id: input.employee_id,
        department: input.department ?? null,
        position: input.position ?? null
      })
      .returning()
      .execute();

    const profile = profileResult[0];

    return { user, profile };
  } catch (error) {
    console.error('Staff creation failed:', error);
    throw error;
  }
}

export async function getAllStaff(): Promise<(StaffProfile & { user: User })[]> {
  try {
    const results = await db.select()
      .from(staffProfilesTable)
      .innerJoin(usersTable, eq(staffProfilesTable.user_id, usersTable.id))
      .execute();

    return results.map(result => ({
      ...result.staff_profiles,
      user: result.users
    }));
  } catch (error) {
    console.error('Get all staff failed:', error);
    throw error;
  }
}

export async function getStaffById(id: number): Promise<(StaffProfile & { user: User }) | null> {
  try {
    const results = await db.select()
      .from(staffProfilesTable)
      .innerJoin(usersTable, eq(staffProfilesTable.user_id, usersTable.id))
      .where(eq(staffProfilesTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const result = results[0];
    return {
      ...result.staff_profiles,
      user: result.users
    };
  } catch (error) {
    console.error('Get staff by ID failed:', error);
    throw error;
  }
}
