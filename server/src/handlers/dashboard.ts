
import { db } from '../db';
import { 
  usersTable, 
  studentProfilesTable, 
  staffProfilesTable, 
  transactionsTable,
  classesTable
} from '../db/schema';
import { type DashboardStats, type UserRole } from '../schema';
import { eq, count, sum, and, gte, desc } from 'drizzle-orm';

export async function getDashboardStats(userRole: UserRole, userId?: number): Promise<DashboardStats> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (userRole === 'ADMINISTRATOR') {
      // Get global statistics for administrators
      const [studentsResult] = await db
        .select({ count: count() })
        .from(studentProfilesTable)
        .execute();

      const [staffResult] = await db
        .select({ count: count() })
        .from(staffProfilesTable)
        .execute();

      const [balanceResult] = await db
        .select({ total: sum(studentProfilesTable.current_balance) })
        .from(studentProfilesTable)
        .execute();

      const [transactionsTodayResult] = await db
        .select({ count: count() })
        .from(transactionsTable)
        .where(gte(transactionsTable.transaction_date, today))
        .execute();

      const [depositsTodayResult] = await db
        .select({ count: count() })
        .from(transactionsTable)
        .where(
          and(
            gte(transactionsTable.transaction_date, today),
            eq(transactionsTable.type, 'DEPOSIT')
          )
        )
        .execute();

      const [withdrawalsTodayResult] = await db
        .select({ count: count() })
        .from(transactionsTable)
        .where(
          and(
            gte(transactionsTable.transaction_date, today),
            eq(transactionsTable.type, 'WITHDRAWAL')
          )
        )
        .execute();

      return {
        total_students: studentsResult.count,
        total_staff: staffResult.count,
        total_balance: parseFloat(balanceResult.total || '0'),
        total_transactions_today: transactionsTodayResult.count,
        total_deposits_today: depositsTodayResult.count,
        total_withdrawals_today: withdrawalsTodayResult.count
      };
    } else if (userRole === 'STAFF' && userId) {
      // Get staff-specific statistics
      const staffProfile = await db
        .select()
        .from(staffProfilesTable)
        .where(eq(staffProfilesTable.user_id, userId))
        .execute();

      if (staffProfile.length === 0) {
        throw new Error('Staff profile not found');
      }

      const staffId = staffProfile[0].id;

      const [transactionsTodayResult] = await db
        .select({ count: count() })
        .from(transactionsTable)
        .where(
          and(
            eq(transactionsTable.staff_id, staffId),
            gte(transactionsTable.transaction_date, today)
          )
        )
        .execute();

      const [depositsTodayResult] = await db
        .select({ count: count() })
        .from(transactionsTable)
        .where(
          and(
            eq(transactionsTable.staff_id, staffId),
            gte(transactionsTable.transaction_date, today),
            eq(transactionsTable.type, 'DEPOSIT')
          )
        )
        .execute();

      const [withdrawalsTodayResult] = await db
        .select({ count: count() })
        .from(transactionsTable)
        .where(
          and(
            eq(transactionsTable.staff_id, staffId),
            gte(transactionsTable.transaction_date, today),
            eq(transactionsTable.type, 'WITHDRAWAL')
          )
        )
        .execute();

      return {
        total_students: 0, // Staff don't manage specific students in this system
        total_staff: 0,
        total_balance: 0,
        total_transactions_today: transactionsTodayResult.count,
        total_deposits_today: depositsTodayResult.count,
        total_withdrawals_today: withdrawalsTodayResult.count
      };
    } else {
      // Students get limited stats (only their own)
      return {
        total_students: 0,
        total_staff: 0,
        total_balance: 0,
        total_transactions_today: 0,
        total_deposits_today: 0,
        total_withdrawals_today: 0
      };
    }
  } catch (error) {
    console.error('Dashboard stats retrieval failed:', error);
    throw error;
  }
}

export async function getStudentDashboard(studentId: number): Promise<{
  current_balance: number;
  recent_transactions: any[];
  assigned_staff: { full_name: string; email: string | null; phone: string | null } | null;
}> {
  try {
    // Get student profile with current balance
    const studentProfile = await db
      .select()
      .from(studentProfilesTable)
      .where(eq(studentProfilesTable.id, studentId))
      .execute();

    if (studentProfile.length === 0) {
      throw new Error('Student profile not found');
    }

    const currentBalance = parseFloat(studentProfile[0].current_balance);

    // Get recent transactions (last 10)
    const recentTransactionsData = await db
      .select({
        id: transactionsTable.id,
        type: transactionsTable.type,
        amount: transactionsTable.amount,
        description: transactionsTable.description,
        transaction_date: transactionsTable.transaction_date,
        balance_after: transactionsTable.balance_after,
        staff_name: usersTable.full_name
      })
      .from(transactionsTable)
      .innerJoin(staffProfilesTable, eq(transactionsTable.staff_id, staffProfilesTable.id))
      .innerJoin(usersTable, eq(staffProfilesTable.user_id, usersTable.id))
      .where(eq(transactionsTable.student_id, studentId))
      .orderBy(desc(transactionsTable.transaction_date))
      .limit(10)
      .execute();

    const recentTransactions = recentTransactionsData.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      amount: parseFloat(transaction.amount),
      description: transaction.description,
      transaction_date: transaction.transaction_date,
      balance_after: parseFloat(transaction.balance_after),
      staff_name: transaction.staff_name
    }));

    // For this system, we don't have assigned staff per student
    // So we return null for assigned_staff
    return {
      current_balance: currentBalance,
      recent_transactions: recentTransactions,
      assigned_staff: null
    };
  } catch (error) {
    console.error('Student dashboard retrieval failed:', error);
    throw error;
  }
}

export async function getStaffDashboard(staffId: number): Promise<{
  students_count: number;
  total_balance_managed: number;
  transactions_today: number;
  recent_students: any[];
}> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total number of students (staff can handle any student)
    const [studentsCountResult] = await db
      .select({ count: count() })
      .from(studentProfilesTable)
      .execute();

    // Get total balance of all students
    const [totalBalanceResult] = await db
      .select({ total: sum(studentProfilesTable.current_balance) })
      .from(studentProfilesTable)
      .execute();

    // Get transactions handled by this staff member today
    const [transactionsTodayResult] = await db
      .select({ count: count() })
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.staff_id, staffId),
          gte(transactionsTable.transaction_date, today)
        )
      )
      .execute();

    // Get recent students who had transactions (last 10 unique students)
    const recentStudentsData = await db
      .select({
        student_id: studentProfilesTable.id,
        student_name: usersTable.full_name,
        nis: studentProfilesTable.nis,
        current_balance: studentProfilesTable.current_balance,
        class_name: classesTable.name,
        last_transaction: transactionsTable.transaction_date
      })
      .from(transactionsTable)
      .innerJoin(studentProfilesTable, eq(transactionsTable.student_id, studentProfilesTable.id))
      .innerJoin(usersTable, eq(studentProfilesTable.user_id, usersTable.id))
      .innerJoin(classesTable, eq(studentProfilesTable.class_id, classesTable.id))
      .where(eq(transactionsTable.staff_id, staffId))
      .orderBy(desc(transactionsTable.transaction_date))
      .limit(10)
      .execute();

    const recentStudents = recentStudentsData.map(student => ({
      student_id: student.student_id,
      student_name: student.student_name,
      nis: student.nis,
      current_balance: parseFloat(student.current_balance),
      class_name: student.class_name,
      last_transaction: student.last_transaction
    }));

    return {
      students_count: studentsCountResult.count,
      total_balance_managed: parseFloat(totalBalanceResult.total || '0'),
      transactions_today: transactionsTodayResult.count,
      recent_students: recentStudents
    };
  } catch (error) {
    console.error('Staff dashboard retrieval failed:', error);
    throw error;
  }
}
