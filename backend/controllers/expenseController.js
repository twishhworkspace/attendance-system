const prisma = require('../db');
const xss = require('xss');

// Helper to check employee permission
const verifyExpenseAccess = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { expenseEnabled: true }
  });
  return user?.expenseEnabled === true;
};

// --- EMPLOYEE ENDPOINTS ---

// Fetch all expense companies for the employee
const getCompanies = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!(await verifyExpenseAccess(userId))) {
      return res.status(403).json({ error: 'Access Denied: Expense Tracker feature is disabled for your account.' });
    }

    const companies = await prisma.expenseCompany.findMany({
      where: { userId },
      orderBy: { name: 'asc' }
    });
    res.json(companies);
  } catch (err) {
    console.error('getCompanies error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Create a new expense company for the employee
const createCompany = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!(await verifyExpenseAccess(userId))) {
      return res.status(403).json({ error: 'Access Denied: Expense Tracker feature is disabled for your account.' });
    }

    const name = req.body.name?.trim();
    if (!name) {
      return res.status(400).json({ error: 'Company/Book name is required' });
    }

    // Check unique name per user
    const existing = await prisma.expenseCompany.findFirst({
      where: { name, userId }
    });

    if (existing) {
      return res.status(400).json({ error: 'A company with this name already exists.' });
    }

    const newCompany = await prisma.expenseCompany.create({
      data: {
        name: xss(name),
        userId
      }
    });

    res.status(201).json(newCompany);
  } catch (err) {
    console.error('createCompany error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Rename/Update an expense company book name
const updateCompany = async (req, res) => {
  try {
    const userId = req.user.id;
    const { companyId } = req.params;
    const name = req.body.name?.trim();

    if (!(await verifyExpenseAccess(userId))) {
      return res.status(403).json({ error: 'Access Denied: Expense Tracker feature is disabled.' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Book name is required' });
    }

    // Verify company ownership
    const company = await prisma.expenseCompany.findFirst({
      where: { id: companyId, userId }
    });

    if (!company) {
      return res.status(404).json({ error: 'Expense book not found.' });
    }

    // Check unique name per user for other books
    const existing = await prisma.expenseCompany.findFirst({
      where: { name, userId, NOT: { id: companyId } }
    });

    if (existing) {
      return res.status(400).json({ error: 'A book with this name already exists.' });
    }

    const updatedCompany = await prisma.expenseCompany.update({
      where: { id: companyId },
      data: { name: xss(name) }
    });

    res.json(updatedCompany);
  } catch (err) {
    console.error('updateCompany error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get all entries for an expense company (with totals & running balance)
const getEntries = async (req, res) => {
  try {
    const userId = req.user.id;
    const { companyId } = req.params;

    if (!(await verifyExpenseAccess(userId))) {
      return res.status(403).json({ error: 'Access Denied: Expense Tracker feature is disabled.' });
    }

    // Verify company ownership
    const company = await prisma.expenseCompany.findFirst({
      where: { id: companyId, userId }
    });

    if (!company) {
      return res.status(404).json({ error: 'Expense company not found.' });
    }

    const entries = await prisma.expenseEntry.findMany({
      where: { expenseCompanyId: companyId },
      orderBy: { date: 'asc' }
    });

    let runningBalance = 0;
    let totalCredit = 0;
    let totalDebit = 0;

    const processedEntries = entries.map(entry => {
      if (entry.status !== 'REJECTED') {
        if (entry.type === 'CREDIT') {
          runningBalance += entry.amount;
          totalCredit += entry.amount;
        } else {
          runningBalance -= entry.amount;
          totalDebit += entry.amount;
        }
      }
      return {
        ...entry,
        runningBalance
      };
    });

    // Reverse to show newest first
    processedEntries.reverse();

    res.json({
      company,
      entries: processedEntries,
      summary: {
        totalCredit,
        totalDebit,
        netBalance: runningBalance
      }
    });
  } catch (err) {
    console.error('getEntries error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Add entry to an expense company
const addEntry = async (req, res) => {
  try {
    const userId = req.user.id;
    const { companyId } = req.params;
    const { type, amount, narration, date } = req.body;

    if (!(await verifyExpenseAccess(userId))) {
      return res.status(403).json({ error: 'Access Denied: Expense Tracker feature is disabled.' });
    }

    if (!['CREDIT', 'DEBIT'].includes(type)) {
      return res.status(400).json({ error: 'Transaction type must be CREDIT or DEBIT' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Verify company ownership
    const company = await prisma.expenseCompany.findFirst({
      where: { id: companyId, userId }
    });

    if (!company) {
      return res.status(404).json({ error: 'Expense company not found.' });
    }

    const newEntry = await prisma.expenseEntry.create({
      data: {
        expenseCompanyId: companyId,
        type,
        amount: parsedAmount,
        narration: narration ? xss(narration) : null,
        date: date ? new Date(date) : new Date()
      }
    });

    res.status(201).json(newEntry);
  } catch (err) {
    console.error('addEntry error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Edit an entry
const updateEntry = async (req, res) => {
  try {
    const userId = req.user.id;
    const { entryId } = req.params;
    const { type, amount, narration, date } = req.body;

    if (!(await verifyExpenseAccess(userId))) {
      return res.status(403).json({ error: 'Access Denied: Expense Tracker feature is disabled.' });
    }

    // Find the entry and verify ownership via the associated company
    const entry = await prisma.expenseEntry.findUnique({
      where: { id: entryId },
      include: { expenseCompany: true }
    });

    if (!entry || entry.expenseCompany.userId !== userId) {
      return res.status(404).json({ error: 'Transaction entry not found.' });
    }

    if (entry.status !== 'PENDING') {
      return res.status(400).json({ error: `Cannot edit transaction entry. This record has already been ${entry.status.toLowerCase()}.` });
    }

    const data = {};
    if (type) {
      if (!['CREDIT', 'DEBIT'].includes(type)) {
        return res.status(400).json({ error: 'Transaction type must be CREDIT or DEBIT' });
      }
      data.type = type;
    }

    if (amount !== undefined) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
      }
      data.amount = parsedAmount;
    }

    if (narration !== undefined) {
      data.narration = narration ? xss(narration) : null;
    }

    if (date) {
      data.date = new Date(date);
    }

    const updatedEntry = await prisma.expenseEntry.update({
      where: { id: entryId },
      data
    });

    res.json(updatedEntry);
  } catch (err) {
    console.error('updateEntry error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Delete an entry
const deleteEntry = async (req, res) => {
  try {
    const userId = req.user.id;
    const { entryId } = req.params;

    if (!(await verifyExpenseAccess(userId))) {
      return res.status(403).json({ error: 'Access Denied: Expense Tracker feature is disabled.' });
    }

    // Find the entry and verify ownership
    const entry = await prisma.expenseEntry.findUnique({
      where: { id: entryId },
      include: { expenseCompany: true }
    });

    if (!entry || entry.expenseCompany.userId !== userId) {
      return res.status(404).json({ error: 'Transaction entry not found.' });
    }

    if (entry.status !== 'PENDING') {
      return res.status(400).json({ error: `Cannot delete transaction entry. This record has already been ${entry.status.toLowerCase()}.` });
    }

    await prisma.expenseEntry.delete({
      where: { id: entryId }
    });

    res.json({ message: 'Transaction entry deleted successfully' });
  } catch (err) {
    console.error('deleteEntry error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// --- ADMIN ENDPOINTS ---

// Fetch all employees in the admin's organization who have expense books enabled/available
const adminGetEmployees = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const employees = await prisma.user.findMany({
      where: {
        companyId,
        role: 'EMPLOYEE',
        expenseEnabled: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobileNumber: true
      },
      orderBy: { name: 'asc' }
    });

    res.json(employees);
  } catch (err) {
    console.error('adminGetEmployees error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Fetch expense companies of a specific employee
const adminGetEmployeeCompanies = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { userId } = req.params;

    // Secure check: verify that this employee belongs to the admin's company
    const employee = await prisma.user.findFirst({
      where: { id: userId, companyId }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found in your organization.' });
    }

    const companies = await prisma.expenseCompany.findMany({
      where: { userId },
      orderBy: { name: 'asc' }
    });

    res.json(companies);
  } catch (err) {
    console.error('adminGetEmployeeCompanies error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Fetch entries for a specific employee's expense company
const adminGetEmployeeEntries = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { companyId: targetCompanyId } = req.params;

    // Verify company ownership and employee relationship to admin's organization
    const company = await prisma.expenseCompany.findUnique({
      where: { id: targetCompanyId },
      include: { user: true }
    });

    if (!company || company.user.companyId !== companyId) {
      return res.status(404).json({ error: 'Expense company not found or access denied.' });
    }

    const entries = await prisma.expenseEntry.findMany({
      where: { expenseCompanyId: targetCompanyId },
      orderBy: { date: 'asc' }
    });

    let runningBalance = 0;
    let totalCredit = 0;
    let totalDebit = 0;

    const processedEntries = entries.map(entry => {
      if (entry.status !== 'REJECTED') {
        if (entry.type === 'CREDIT') {
          runningBalance += entry.amount;
          totalCredit += entry.amount;
        } else {
          runningBalance -= entry.amount;
          totalDebit += entry.amount;
        }
      }
      return {
        ...entry,
        runningBalance
      };
    });

    processedEntries.reverse();

    res.json({
      company,
      employee: {
        id: company.user.id,
        name: company.user.name,
        email: company.user.email
      },
      entries: processedEntries,
      summary: {
        totalCredit,
        totalDebit,
        netBalance: runningBalance
      }
    });
  } catch (err) {
    console.error('adminGetEmployeeEntries error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Admin status override: APPROVE or REJECT an entry
const adminUpdateEntryStatus = async (req, res) => {
  try {
    const adminCompanyId = req.user.companyId;
    const { entryId } = req.params;
    const { action } = req.body;

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ error: 'Action must be APPROVE or REJECT' });
    }

    const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    // Find entry and check if user belongs to admin's company
    const entry = await prisma.expenseEntry.findUnique({
      where: { id: entryId },
      include: { expenseCompany: { include: { user: true } } }
    });

    if (!entry || entry.expenseCompany.user.companyId !== adminCompanyId) {
      return res.status(404).json({ error: 'Transaction entry not found or access denied.' });
    }

    const updated = await prisma.expenseEntry.update({
      where: { id: entryId },
      data: { status }
    });

    res.json({
      message: `Transaction entry has been ${status.toLowerCase()} successfully`,
      entry: updated
    });
  } catch (err) {
    console.error('adminUpdateEntryStatus error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getCompanies,
  createCompany,
  updateCompany,
  getEntries,
  addEntry,
  updateEntry,
  deleteEntry,
  adminGetEmployees,
  adminGetEmployeeCompanies,
  adminGetEmployeeEntries,
  adminUpdateEntryStatus
};
