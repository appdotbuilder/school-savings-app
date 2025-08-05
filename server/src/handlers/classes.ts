
import { db } from '../db';
import { classesTable, studentProfilesTable } from '../db/schema';
import { type CreateClassInput, type Class } from '../schema';
import { eq, count } from 'drizzle-orm';

export async function createClass(input: CreateClassInput): Promise<Class> {
  try {
    const result = await db.insert(classesTable)
      .values({
        name: input.name,
        description: input.description || null,
        academic_year: input.academic_year
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Class creation failed:', error);
    throw error;
  }
}

export async function getAllClasses(): Promise<Class[]> {
  try {
    const result = await db.select()
      .from(classesTable)
      .orderBy(classesTable.academic_year, classesTable.name)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    throw error;
  }
}

export async function getClassById(id: number): Promise<Class | null> {
  try {
    const result = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, id))
      .execute();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Failed to fetch class by ID:', error);
    throw error;
  }
}

export async function updateClass(id: number, input: Partial<CreateClassInput>): Promise<Class | null> {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.academic_year !== undefined) updateData.academic_year = input.academic_year;

    // If no fields to update, return current class
    if (Object.keys(updateData).length === 0) {
      return await getClassById(id);
    }

    const result = await db.update(classesTable)
      .set(updateData)
      .where(eq(classesTable.id, id))
      .returning()
      .execute();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Class update failed:', error);
    throw error;
  }
}

export async function deleteClass(id: number): Promise<{ success: boolean }> {
  try {
    // Check if class has any students assigned
    const studentCount = await db.select({ count: count() })
      .from(studentProfilesTable)
      .where(eq(studentProfilesTable.class_id, id))
      .execute();

    if (studentCount[0].count > 0) {
      throw new Error('Cannot delete class with assigned students');
    }

    const result = await db.delete(classesTable)
      .where(eq(classesTable.id, id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Class deletion failed:', error);
    throw error;
  }
}
