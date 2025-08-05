
import { db } from '../db';
import { usersTable, studentProfilesTable, classesTable } from '../db/schema';
import { type CreateStudentInput, type StudentProfile, type User } from '../schema';
import { eq } from 'drizzle-orm';

export async function createStudent(input: CreateStudentInput): Promise<{ user: User; profile: StudentProfile }> {
  try {
    // Create user record first (using NIS as username and default password)
    const userResult = await db.insert(usersTable)
      .values({
        username: input.nis,
        password_hash: 'hashed_nis', // In real app, this would be properly hashed
        role: 'STUDENT',
        full_name: input.full_name,
        email: input.email || null,
        phone: input.phone || null,
        is_active: true,
        must_change_password: true
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create student profile
    const profileResult = await db.insert(studentProfilesTable)
      .values({
        user_id: user.id,
        nis: input.nis,
        class_id: input.class_id,
        parent_name: input.parent_name || null,
        parent_phone: input.parent_phone || null,
        address: input.address || null,
        current_balance: '0.00' // Convert number to string for numeric column
      })
      .returning()
      .execute();

    const profile = profileResult[0];

    return {
      user,
      profile: {
        ...profile,
        current_balance: parseFloat(profile.current_balance) // Convert string back to number
      }
    };
  } catch (error) {
    console.error('Student creation failed:', error);
    throw error;
  }
}

export async function getAllStudents(): Promise<(StudentProfile & { user: User; class: { name: string } })[]> {
  try {
    const results = await db.select()
      .from(studentProfilesTable)
      .innerJoin(usersTable, eq(studentProfilesTable.user_id, usersTable.id))
      .innerJoin(classesTable, eq(studentProfilesTable.class_id, classesTable.id))
      .execute();

    return results.map(result => ({
      ...result.student_profiles,
      current_balance: parseFloat(result.student_profiles.current_balance), // Convert numeric field
      user: result.users,
      class: {
        name: result.classes.name
      }
    }));
  } catch (error) {
    console.error('Get all students failed:', error);
    throw error;
  }
}

export async function getStudentById(id: number): Promise<(StudentProfile & { user: User; class: { name: string } }) | null> {
  try {
    const results = await db.select()
      .from(studentProfilesTable)
      .innerJoin(usersTable, eq(studentProfilesTable.user_id, usersTable.id))
      .innerJoin(classesTable, eq(studentProfilesTable.class_id, classesTable.id))
      .where(eq(studentProfilesTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const result = results[0];
    return {
      ...result.student_profiles,
      current_balance: parseFloat(result.student_profiles.current_balance), // Convert numeric field
      user: result.users,
      class: {
        name: result.classes.name
      }
    };
  } catch (error) {
    console.error('Get student by ID failed:', error);
    throw error;
  }
}

export async function getStudentsByClass(classId: number): Promise<(StudentProfile & { user: User })[]> {
  try {
    const results = await db.select()
      .from(studentProfilesTable)
      .innerJoin(usersTable, eq(studentProfilesTable.user_id, usersTable.id))
      .where(eq(studentProfilesTable.class_id, classId))
      .execute();

    return results.map(result => ({
      ...result.student_profiles,
      current_balance: parseFloat(result.student_profiles.current_balance), // Convert numeric field
      user: result.users
    }));
  } catch (error) {
    console.error('Get students by class failed:', error);
    throw error;
  }
}

export async function updateStudentBalance(studentId: number, newBalance: number): Promise<{ success: boolean }> {
  try {
    await db.update(studentProfilesTable)
      .set({
        current_balance: newBalance.toString() // Convert number to string for numeric column
      })
      .where(eq(studentProfilesTable.id, studentId))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Update student balance failed:', error);
    throw error;
  }
}
