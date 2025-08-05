
import { db } from '../db';
import { 
  transactionsTable, 
  studentProfilesTable, 
  staffProfilesTable, 
  usersTable, 
  classesTable 
} from '../db/schema';
import { 
  type CreateTransactionInput, 
  type Transaction, 
  type ReportFilters 
} from '../schema';
import { eq, and, gte, lte, desc, sql, inArray } from 'drizzle-orm';

export async function createTransaction(staffId: number, input: CreateTransactionInput): Promise<Transaction> {
  try {
    return await db.transaction(async (tx) => {
      // Get current student balance
      const student = await tx.select()
        .from(studentProfilesTable)
        .where(eq(studentProfilesTable.id, input.student_id))
        .execute();

      if (student.length === 0) {
        throw new Error('Student not found');
      }

      const currentBalance = parseFloat(student[0].current_balance);
      const transactionAmount = input.amount;
      
      let newBalance: number;
      if (input.type === 'DEPOSIT') {
        newBalance = currentBalance + transactionAmount;
      } else {
        newBalance = currentBalance - transactionAmount;
        // Check for negative balance
        if (newBalance < 0) {
          throw new Error('Insufficient balance');
        }
      }

      // Update student balance
      await tx.update(studentProfilesTable)
        .set({ current_balance: newBalance.toString() })
        .where(eq(studentProfilesTable.id, input.student_id))
        .execute();

      // Create transaction record
      const result = await tx.insert(transactionsTable)
        .values({
          student_id: input.student_id,
          staff_id: staffId,
          type: input.type,
          amount: transactionAmount.toString(),
          balance_before: currentBalance.toString(),
          balance_after: newBalance.toString(),
          description: input.description || null
        })
        .returning()
        .execute();

      const transaction = result[0];
      return {
        ...transaction,
        amount: parseFloat(transaction.amount),
        balance_before: parseFloat(transaction.balance_before),
        balance_after: parseFloat(transaction.balance_after)
      };
    });
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
}

export async function getTransactionsByStudent(studentId: number): Promise<(Transaction & { staff: { user: { full_name: string } } })[]> {
  try {
    const results = await db.select()
      .from(transactionsTable)
      .innerJoin(staffProfilesTable, eq(transactionsTable.staff_id, staffProfilesTable.id))
      .innerJoin(usersTable, eq(staffProfilesTable.user_id, usersTable.id))
      .where(eq(transactionsTable.student_id, studentId))
      .orderBy(desc(transactionsTable.created_at))
      .execute();

    return results.map(result => ({
      ...result.transactions,
      amount: parseFloat(result.transactions.amount),
      balance_before: parseFloat(result.transactions.balance_before),
      balance_after: parseFloat(result.transactions.balance_after),
      staff: {
        user: {
          full_name: result.users.full_name
        }
      }
    }));
  } catch (error) {
    console.error('Failed to get transactions by student:', error);
    throw error;
  }
}

export async function getTransactionsByStaff(staffId: number, date?: Date): Promise<(Transaction & { student: { user: { full_name: string }; nis: string } })[]> {
  try {
    // Build base query
    let results;
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      results = await db.select()
        .from(transactionsTable)
        .innerJoin(studentProfilesTable, eq(transactionsTable.student_id, studentProfilesTable.id))
        .innerJoin(usersTable, eq(studentProfilesTable.user_id, usersTable.id))
        .where(and(
          eq(transactionsTable.staff_id, staffId),
          gte(transactionsTable.transaction_date, startOfDay),
          lte(transactionsTable.transaction_date, endOfDay)
        ))
        .orderBy(desc(transactionsTable.created_at))
        .execute();
    } else {
      results = await db.select()
        .from(transactionsTable)
        .innerJoin(studentProfilesTable, eq(transactionsTable.student_id, studentProfilesTable.id))
        .innerJoin(usersTable, eq(studentProfilesTable.user_id, usersTable.id))
        .where(eq(transactionsTable.staff_id, staffId))
        .orderBy(desc(transactionsTable.created_at))
        .execute();
    }

    return results.map(result => ({
      ...result.transactions,
      amount: parseFloat(result.transactions.amount),
      balance_before: parseFloat(result.transactions.balance_before),
      balance_after: parseFloat(result.transactions.balance_after),
      student: {
        user: {
          full_name: result.users.full_name
        },
        nis: result.student_profiles.nis
      }
    }));
  } catch (error) {
    console.error('Failed to get transactions by staff:', error);
    throw error;
  }
}

export async function getTransactionsReport(filters: ReportFilters): Promise<(Transaction & { 
  student: { user: { full_name: string }; nis: string; class: { name: string } }; 
  staff: { user: { full_name: string } } 
})[]> {
  try {
    // Simple approach: get all transactions that match basic filters first
    let baseTransactions = await db.select()
      .from(transactionsTable)
      .innerJoin(studentProfilesTable, eq(transactionsTable.student_id, studentProfilesTable.id))
      .innerJoin(classesTable, eq(studentProfilesTable.class_id, classesTable.id))
      .orderBy(desc(transactionsTable.created_at))
      .execute();

    // Apply filters in memory for simplicity
    let filteredTransactions = baseTransactions;

    if (filters.start_date) {
      const startOfDay = new Date(filters.start_date);
      startOfDay.setHours(0, 0, 0, 0);
      filteredTransactions = filteredTransactions.filter(t => 
        t.transactions.transaction_date >= startOfDay
      );
    }

    if (filters.end_date) {
      const endOfDay = new Date(filters.end_date);
      endOfDay.setHours(23, 59, 59, 999);
      filteredTransactions = filteredTransactions.filter(t => 
        t.transactions.transaction_date <= endOfDay
      );
    }

    if (filters.student_id) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.transactions.student_id === filters.student_id
      );
    }

    if (filters.class_id) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.student_profiles.class_id === filters.class_id
      );
    }

    if (filters.transaction_type) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.transactions.type === filters.transaction_type
      );
    }

    if (filteredTransactions.length === 0) {
      return [];
    }

    // Get student user data
    const studentIds = [...new Set(filteredTransactions.map(t => t.student_profiles.user_id))];
    const studentUsers = await db.select()
      .from(usersTable)
      .where(inArray(usersTable.id, studentIds))
      .execute();

    // Get staff user data
    const staffIds = [...new Set(filteredTransactions.map(t => t.transactions.staff_id))];
    const staffProfiles = await db.select()
      .from(staffProfilesTable)
      .innerJoin(usersTable, eq(staffProfilesTable.user_id, usersTable.id))
      .where(inArray(staffProfilesTable.id, staffIds))
      .execute();

    // Create lookup maps
    const studentUserMap = new Map();
    studentUsers.forEach(user => {
      studentUserMap.set(user.id, user.full_name);
    });

    const staffUserMap = new Map();
    staffProfiles.forEach(sp => {
      staffUserMap.set(sp.staff_profiles.id, sp.users.full_name);
    });

    return filteredTransactions.map(result => ({
      ...result.transactions,
      amount: parseFloat(result.transactions.amount),
      balance_before: parseFloat(result.transactions.balance_before),
      balance_after: parseFloat(result.transactions.balance_after),
      student: {
        user: {
          full_name: studentUserMap.get(result.student_profiles.user_id) || 'Unknown'
        },
        nis: result.student_profiles.nis,
        class: {
          name: result.classes.name
        }
      },
      staff: {
        user: {
          full_name: staffUserMap.get(result.transactions.staff_id) || 'Unknown'
        }
      }
    }));
  } catch (error) {
    console.error('Failed to get transactions report:', error);
    throw error;
  }
}

export async function getDailyTransactionSummary(date: Date): Promise<{
  total_transactions: number;
  total_deposits: number;
  total_withdrawals: number;
  deposit_amount: number;
  withdrawal_amount: number;
}> {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const results = await db.select({
      type: transactionsTable.type,
      total_amount: sql<string>`sum(${transactionsTable.amount})`,
      count: sql<number>`count(*)::int`
    })
    .from(transactionsTable)
    .where(and(
      gte(transactionsTable.transaction_date, startOfDay),
      lte(transactionsTable.transaction_date, endOfDay)
    ))
    .groupBy(transactionsTable.type)
    .execute();

    let total_transactions = 0;
    let total_deposits = 0;
    let total_withdrawals = 0;
    let deposit_amount = 0;
    let withdrawal_amount = 0;

    for (const result of results) {
      const count = result.count;
      const totalAmount = parseFloat(result.total_amount);
      
      total_transactions += count;
      
      if (result.type === 'DEPOSIT') {
        total_deposits += count;
        deposit_amount += totalAmount;
      } else {
        total_withdrawals += count;
        withdrawal_amount += totalAmount;
      }
    }

    return {
      total_transactions,
      total_deposits,
      total_withdrawals,
      deposit_amount,
      withdrawal_amount
    };
  } catch (error) {
    console.error('Failed to get daily transaction summary:', error);
    throw error;
  }
}
