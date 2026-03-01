import { db } from './db';

// Type definitions
export interface Agency {
  id: string;
  name: string;
  owner_id: string;
  currency: string;
  email?: string;
  created_at: string;
}

export interface User {
  id: string;
  agency_id: string;
  email: string;
  name: string | null;
  role: string;
  password_hash: string | null;
  created_at: string;
}

export interface Plan {
  id: string;
  agency_id: string;
  name: string;
  price: string;
  billing_cycle: string;
  description: string | null;
  created_at: string;
}

export interface PlanItem {
  id: string;
  plan_id: string;
  deliverable_type: string;
  qty: number;
  recurrence: string;
  created_at: string;
}

export interface Client {
  id: string;
  agency_id: string;
  name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  token: string | null;
  created_at: string;
}

export interface ClientPlan {
  id: string;
  client_id: string;
  plan_id: string;
  start_date: string;
  status: string;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  invoice_id: string;
  agency_id: string;
  provider_id: string;
  amount: number;
  currency: string;
  status: string;
  transaction_id?: string;
  reference_id?: string;
  webhook_payload?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface AgencyPaymentMethod {
  id: string;
  agency_id: string;
  provider_id: string;
  credentials: Record<string, string>;
  enabled: boolean;
  test_mode: boolean;
  created_at: Date;
  updated_at: Date;
}

// Agency queries
export async function createAgency(
  name: string,
  ownerId: string,
  currency: string = 'NPR'
): Promise<Agency> {
  try {
    const result = await db.query(
      'INSERT INTO agencies (name, owner_id, currency) VALUES ($1, $2, $3) RETURNING *',
      [name, ownerId, currency]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Failed to create agency:', err);
    throw new Error(`Failed to create agency: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function getAgencyById(id: string, requestingAgencyId?: string): Promise<Agency | null> {
  try {
    // If requestingAgencyId is provided, verify multi-tenant isolation
    if (requestingAgencyId) {
      const result = await db.query(
        'SELECT * FROM agencies WHERE id = $1 AND id = $2',
        [id, requestingAgencyId]
      );
      return result.rows[0] || null;
    }

    // Otherwise, return agency without isolation check
    const result = await db.query('SELECT * FROM agencies WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (err) {
    console.error('Failed to get agency by ID:', err);
    throw new Error(`Failed to fetch agency: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function getAgenciesByOwnerId(ownerId: string): Promise<Agency[]> {
  try {
    const result = await db.query(
      'SELECT * FROM agencies WHERE owner_id = $1 ORDER BY created_at DESC',
      [ownerId]
    );
    return result.rows;
  } catch (err) {
    console.error('Failed to get agencies by owner ID:', err);
    throw new Error(`Failed to fetch agencies: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

// User queries
export async function createUser(
  agencyId: string,
  email: string,
  name: string,
  role: string = 'member'
): Promise<User> {
  try {
    const result = await db.query(
      'INSERT INTO users (agency_id, email, name, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [agencyId, email, name, role]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Failed to create user:', err);
    throw new Error(`Failed to create user: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  } catch (err) {
    console.error('Failed to get user by email:', err);
    throw new Error(`Failed to fetch user: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (err) {
    console.error('Failed to get user by ID:', err);
    throw new Error(`Failed to fetch user: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function getUsersByAgency(agencyId: string): Promise<User[]> {
  try {
    const result = await db.query(
      'SELECT * FROM users WHERE agency_id = $1 ORDER BY created_at DESC',
      [agencyId]
    );
    return result.rows;
  } catch (err) {
    console.error('Failed to get users by agency:', err);
    throw new Error(`Failed to fetch users: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

// Plan queries
export async function createPlan(
  agencyId: string,
  name: string,
  price: number,
  billingCycle: string = 'monthly',
  description?: string
): Promise<Plan> {
  try {
    const result = await db.query(
      'INSERT INTO plans (agency_id, name, price, billing_cycle, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [agencyId, name, price, billingCycle, description || null]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Failed to create plan:', err);
    throw new Error(`Failed to create plan: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function getPlanById(id: string, agencyId: string): Promise<Plan | null> {
  try {
    const result = await db.query(
      'SELECT * FROM plans WHERE id = $1 AND agency_id = $2',
      [id, agencyId]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error('Failed to get plan by ID:', err);
    throw new Error(`Failed to fetch plan: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function getPlansByAgency(agencyId: string): Promise<Plan[]> {
  try {
    const result = await db.query(
      'SELECT * FROM plans WHERE agency_id = $1 ORDER BY created_at DESC',
      [agencyId]
    );
    return result.rows;
  } catch (err) {
    console.error('Failed to get plans by agency:', err);
    throw new Error(`Failed to fetch plans: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function updatePlan(
  id: string,
  agencyId: string,
  name?: string,
  price?: number,
  billingCycle?: string,
  description?: string
): Promise<Plan | null> {
  try {
    const fields: string[] = [];
    const values: (string | number | boolean | null | undefined)[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (price !== undefined) {
      fields.push(`price = $${paramCount++}`);
      values.push(price);
    }
    if (billingCycle !== undefined) {
      fields.push(`billing_cycle = $${paramCount++}`);
      values.push(billingCycle);
    }
    if (description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (fields.length === 0) return getPlanById(id, agencyId);

    values.push(id);
    values.push(agencyId);
    const query = `UPDATE plans SET ${fields.join(', ')} WHERE id = $${paramCount} AND agency_id = $${paramCount + 1} RETURNING *`;
    const result = await db.query(query, values);
    return result.rows[0] || null;
  } catch (err) {
    console.error('Failed to update plan:', err);
    throw new Error(`Failed to update plan: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function deletePlan(id: string, agencyId: string): Promise<boolean> {
  try {
    const result = await db.query('DELETE FROM plans WHERE id = $1 AND agency_id = $2', [id, agencyId]);
    return result.rowCount! > 0;
  } catch (err) {
    console.error('Failed to delete plan:', err);
    throw new Error(`Failed to delete plan: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

// Plan items queries
export async function createPlanItem(
  planId: string,
  deliverableType: string,
  qty: number = 1,
  recurrence: string = 'monthly'
): Promise<PlanItem> {
  try {
    const result = await db.query(
      'INSERT INTO plan_items (plan_id, deliverable_type, qty, recurrence) VALUES ($1, $2, $3, $4) RETURNING *',
      [planId, deliverableType, qty, recurrence]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Failed to create plan item:', err);
    throw new Error(`Failed to create plan item: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function getPlanItemsByPlan(planId: string): Promise<PlanItem[]> {
  try {
    const result = await db.query(
      'SELECT * FROM plan_items WHERE plan_id = $1 ORDER BY created_at DESC',
      [planId]
    );
    return result.rows;
  } catch (err) {
    console.error('Failed to get plan items by plan:', err);
    throw new Error(`Failed to fetch plan items: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

// Client queries
export async function createClient(
  agencyId: string,
  name: string,
  email: string,
  phone?: string,
  companyName?: string
): Promise<Client> {
  try {
    const result = await db.query(
      'INSERT INTO clients (agency_id, name, email, phone, company_name) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [agencyId, name, email, phone || null, companyName || null]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Failed to create client:', err);
    throw new Error(`Failed to create client: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function getClientById(id: string, agencyId?: string): Promise<Client | null> {
  try {
    if (agencyId) {
      const result = await db.query('SELECT * FROM clients WHERE id = $1 AND agency_id = $2', [id, agencyId]);
      return result.rows[0] || null;
    }
    const result = await db.query('SELECT * FROM clients WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (err) {
    console.error('Failed to get client by ID:', err);
    throw new Error(`Failed to fetch client: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function getClientsByAgency(agencyId: string): Promise<Client[]> {
  try {
    const result = await db.query(
      'SELECT * FROM clients WHERE agency_id = $1 ORDER BY created_at DESC',
      [agencyId]
    );
    return result.rows;
  } catch (err) {
    console.error('Failed to get clients by agency:', err);
    throw new Error(`Failed to fetch clients: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function getClientsWithPlans(agencyId: string): Promise<(Client & { planName?: string })[]> {
  try {
    const result = await db.query(`
      SELECT
        c.id, c.agency_id, c.name, c.email, c.company_name, c.phone, c.created_at,
        p.name as plan_name
      FROM clients c
      LEFT JOIN client_plans cp ON c.id = cp.client_id
      LEFT JOIN plans p ON cp.plan_id = p.id
      WHERE c.agency_id = $1
      ORDER BY c.created_at DESC
    `, [agencyId]);

    return result.rows.map(row => ({
      ...row,
      planName: row.plan_name || 'No plan'
    }));
  } catch (err) {
    console.error('Failed to get clients with plans:', err);
    throw new Error(`Failed to fetch clients: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function updateClient(
  id: string,
  agencyId: string,
  name?: string,
  email?: string,
  phone?: string,
  companyName?: string
): Promise<Client | null> {
  try {
    const fields: string[] = [];
    const values: (string | number | boolean | null | undefined)[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (companyName !== undefined) {
      fields.push(`company_name = $${paramCount++}`);
      values.push(companyName);
    }

    if (fields.length === 0) return getClientById(id, agencyId);

    values.push(id);
    values.push(agencyId);
    const query = `UPDATE clients SET ${fields.join(', ')} WHERE id = $${paramCount} AND agency_id = $${paramCount + 1} RETURNING *`;
    const result = await db.query(query, values);
    return result.rows[0] || null;
  } catch (err) {
    console.error('Failed to update client:', err);
    throw new Error(`Failed to update client: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

// Client plans (subscriptions) queries
export async function createClientPlan(
  clientId: string,
  planId: string,
  startDate: Date = new Date(),
  status: string = 'active'
): Promise<ClientPlan> {
  try {
    const result = await db.query(
      'INSERT INTO client_plans (client_id, plan_id, start_date, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [clientId, planId, startDate.toISOString(), status]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Failed to create client plan:', err);
    throw new Error(`Failed to create client plan: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function getClientPlanById(id: string): Promise<ClientPlan | null> {
  try {
    const result = await db.query('SELECT * FROM client_plans WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (err) {
    console.error('Failed to get client plan by ID:', err);
    throw new Error(`Failed to fetch client plan: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function getClientPlansByClient(clientId: string): Promise<ClientPlan[]> {
  try {
    const result = await db.query(
      'SELECT * FROM client_plans WHERE client_id = $1 ORDER BY created_at DESC',
      [clientId]
    );
    return result.rows;
  } catch (err) {
    console.error('Failed to get client plans by client:', err);
    throw new Error(`Failed to fetch client plans: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function updateClientPlanStatus(
  id: string,
  agencyId: string,
  status: string
): Promise<ClientPlan | null> {
  try {
    const result = await db.query(
      'UPDATE client_plans SET status = $1 WHERE id = $2 AND client_id IN (SELECT id FROM clients WHERE agency_id = $3) RETURNING *',
      [status, id, agencyId]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error('Failed to update client plan status:', err);
    throw new Error(`Failed to update client plan status: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function deleteClientPlan(id: string, agencyId: string): Promise<boolean> {
  try {
    const result = await db.query(
      'DELETE FROM client_plans WHERE id = $1 AND client_id IN (SELECT id FROM clients WHERE agency_id = $2)',
      [id, agencyId]
    );
    return result.rowCount! > 0;
  } catch (err) {
    console.error('Failed to delete client plan:', err);
    throw new Error(`Failed to delete client plan: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

// Invoice types
export interface Invoice {
  id: string;
  agency_id: string;
  client_id: string;
  amount: string;
  status: string;
  due_date: string | null;
  paid_date: string | null;
  pdf_url?: string | null;
  created_at: string;
  updated_at?: string;
  // Only populated by getInvoicesByAgency() which JOINs with clients table
  client_name?: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  rate: string | number;
  amount?: string | number;
  created_at: string;
}

// Invoice queries
export async function createInvoice(
  agencyId: string,
  clientId: string,
  amount: number,
  dueDate?: string
): Promise<Invoice> {
  try {
    const result = await db.query(
      'INSERT INTO invoices (agency_id, client_id, amount, due_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [agencyId, clientId, amount, dueDate || null]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Failed to create invoice:', err);
    throw new Error(`Failed to create invoice: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function getInvoiceById(id: string, agencyId: string): Promise<Invoice | null> {
  try {
    const result = await db.query('SELECT * FROM invoices WHERE id = $1 AND agency_id = $2', [id, agencyId]);
    return result.rows[0] || null;
  } catch (err) {
    console.error('Failed to get invoice by ID:', err);
    throw new Error(`Failed to fetch invoice: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function getInvoicesByAgency(agencyId: string): Promise<Invoice[]> {
  try {
    const result = await db.query(
      'SELECT i.*, c.name as client_name FROM invoices i JOIN clients c ON i.client_id = c.id WHERE i.agency_id = $1 ORDER BY i.created_at DESC',
      [agencyId]
    );
    return result.rows;
  } catch (err) {
    console.error('Failed to get invoices by agency:', err);
    throw new Error(`Failed to fetch invoices: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function getInvoicesByClient(clientId: string, agencyId: string): Promise<Invoice[]> {
  try {
    const result = await db.query(
      'SELECT * FROM invoices WHERE client_id = $1 AND agency_id = $2 ORDER BY created_at DESC',
      [clientId, agencyId]
    );
    return result.rows;
  } catch (err) {
    console.error('Failed to get invoices by client:', err);
    throw new Error(`Failed to fetch invoices: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function addInvoiceItem(
  invoiceId: string,
  description: string,
  quantity: number = 1,
  rate: number
): Promise<InvoiceItem> {
  try {
    const result = await db.query(
      'INSERT INTO invoice_items (invoice_id, description, quantity, rate) VALUES ($1, $2, $3, $4) RETURNING *',
      [invoiceId, description, quantity, rate]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Failed to add invoice item:', err);
    throw new Error(`Failed to add invoice item: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function getInvoiceItems(invoiceId: string, agencyId: string): Promise<InvoiceItem[]> {
  try {
    const result = await db.query(
      'SELECT ii.* FROM invoice_items ii JOIN invoices i ON ii.invoice_id = i.id WHERE ii.invoice_id = $1 AND i.agency_id = $2 ORDER BY ii.created_at DESC',
      [invoiceId, agencyId]
    );
    return result.rows;
  } catch (err) {
    console.error('Failed to get invoice items:', err);
    throw new Error(`Failed to fetch invoice items: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export async function updateInvoiceStatus(
  invoiceId: string,
  agencyId: string,
  status: string,
  pdfUrl?: string
): Promise<Invoice | null> {
  try {
    let query: string;
    let params: (string | null)[];

    if (pdfUrl) {
      query = 'UPDATE invoices SET status = $1, pdf_url = $2, updated_at = NOW() WHERE id = $3 AND agency_id = $4 RETURNING *';
      params = [status, pdfUrl, invoiceId, agencyId];
    } else if (status === 'paid') {
      query = 'UPDATE invoices SET status = $1, paid_date = NOW(), updated_at = NOW() WHERE id = $2 AND agency_id = $3 RETURNING *';
      params = [status, invoiceId, agencyId];
    } else {
      query = 'UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2 AND agency_id = $3 RETURNING *';
      params = [status, invoiceId, agencyId];
    }

    const result = await db.query(query, params);
    return result.rows[0] || null;
  } catch (err) {
    console.error('Failed to update invoice status:', err);
    throw new Error(`Failed to update invoice status: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

// Payment type definitions
export interface Payment {
  id: string;
  invoice_id: string;
  agency_id: string;
  amount: string | number;
  provider: string;
  status: string;
  reference_id?: string;
  receipt_url?: string;
  meta_json?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Payment queries
export async function createPayment(
  invoiceId: string,
  agencyId: string,
  paymentData: {
    amount: number;
    provider?: string;
    referenceId?: string;
    receiptUrl?: string;
    meta?: Record<string, any>;
  }
): Promise<Payment> {
  try {
    const result = await db.query(
      'INSERT INTO payments (invoice_id, agency_id, amount, provider, status, reference_id, receipt_url, meta_json) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        invoiceId,
        agencyId,
        paymentData.amount,
        paymentData.provider || 'bank_transfer',
        'pending',
        paymentData.referenceId || '',
        paymentData.receiptUrl || null,
        JSON.stringify(paymentData.meta || {}),
      ]
    );
    return result.rows[0] as Payment;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw new Error(`Failed to create payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updatePaymentStatus(
  paymentId: string,
  agencyId: string,
  status: string,
  receiptUrl?: string
): Promise<Payment | null> {
  try {
    let query: string;
    let params: (string | null)[];

    if (receiptUrl) {
      query =
        'UPDATE payments SET status = $1, receipt_url = $2, updated_at = NOW() WHERE id = $3 AND agency_id = $4 RETURNING *';
      params = [status, receiptUrl, paymentId, agencyId];
    } else {
      query =
        'UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2 AND agency_id = $3 RETURNING *';
      params = [status, paymentId, agencyId];
    }

    const result = await db.query(query, params);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw new Error(`Failed to update payment status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getPaymentsByInvoice(invoiceId: string, agencyId: string): Promise<Payment[]> {
  try {
    const result = await db.query(
      'SELECT * FROM payments WHERE invoice_id = $1 AND agency_id = $2 ORDER BY created_at DESC',
      [invoiceId, agencyId]
    );
    return result.rows as Payment[];
  } catch (error) {
    console.error('Error fetching payments by invoice:', error);
    throw new Error(`Failed to fetch payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getPaymentById(paymentId: string, agencyId: string): Promise<Payment | null> {
  try {
    const result = await db.query(
      'SELECT * FROM payments WHERE id = $1 AND agency_id = $2',
      [paymentId, agencyId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching payment:', error);
    throw new Error(`Failed to fetch payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Deliverable type definitions
export interface Deliverable {
  id: string;
  agency_id: string;
  client_id: string;
  plan_id: string;
  title: string;
  description?: string;
  status: 'draft' | 'in_review' | 'approved' | 'changes_requested' | 'done';
  month_year: string;
  due_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface DeliverableFile {
  id: string;
  deliverable_id: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  file_url: string;
  uploaded_by: string;
  version: number;
  created_at: Date;
}

export interface DeliverableComment {
  id: string;
  deliverable_id: string;
  user_id: string;
  user_name?: string;
  comment: string;
  is_revision_request: boolean;
  created_at: Date;
}

// ============================================================
// Deliverable queries
// ============================================================

export async function createDeliverable(data: {
  agencyId: string;
  clientId: string;
  planId: string;
  title: string;
  description?: string;
  monthYear: string;
  dueDate?: Date;
}): Promise<Deliverable> {
  const result = await db.query(
    `INSERT INTO deliverables
     (agency_id, client_id, plan_id, title, description, month_year, due_date, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
     RETURNING *`,
    [data.agencyId, data.clientId, data.planId, data.title, data.description ?? null, data.monthYear, data.dueDate ?? null]
  );
  return result.rows[0];
}

export async function getDeliverablesByClient(clientId: string, agencyId: string): Promise<Deliverable[]> {
  const result = await db.query(
    `SELECT * FROM deliverables WHERE client_id = $1 AND agency_id = $2 ORDER BY due_date ASC`,
    [clientId, agencyId]
  );
  return result.rows;
}

export async function getDeliverablesByAgency(agencyId: string): Promise<Deliverable[]> {
  const result = await db.query(
    `SELECT d.*, c.name as client_name FROM deliverables d
     JOIN clients c ON d.client_id = c.id
     WHERE d.agency_id = $1
     ORDER BY d.due_date ASC`,
    [agencyId]
  );
  return result.rows;
}

export async function getDeliverableById(id: string, agencyId: string): Promise<Deliverable | null> {
  const result = await db.query(
    `SELECT * FROM deliverables WHERE id = $1 AND agency_id = $2`,
    [id, agencyId]
  );
  return result.rows[0] || null;
}

export async function updateDeliverableStatus(
  id: string,
  agencyId: string,
  status: string
): Promise<Deliverable> {
  const result = await db.query(
    `UPDATE deliverables SET status = $1, updated_at = NOW() WHERE id = $2 AND agency_id = $3 RETURNING *`,
    [status, id, agencyId]
  );
  return result.rows[0];
}

export async function addDeliverableFile(data: {
  deliverableId: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  fileUrl: string;
  uploadedBy: string;
}): Promise<DeliverableFile> {
  const result = await db.query(
    `INSERT INTO deliverable_files (deliverable_id, file_name, file_size, file_type, file_url, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.deliverableId, data.fileName, data.fileSize ?? null, data.fileType ?? null, data.fileUrl, data.uploadedBy]
  );
  return result.rows[0];
}

export async function getDeliverableFiles(deliverableId: string): Promise<DeliverableFile[]> {
  const result = await db.query(
    `SELECT * FROM deliverable_files WHERE deliverable_id = $1 ORDER BY created_at DESC`,
    [deliverableId]
  );
  return result.rows;
}

export async function addDeliverableComment(data: {
  deliverableId: string;
  userId: string;
  comment: string;
  isRevisionRequest?: boolean;
}): Promise<DeliverableComment> {
  const result = await db.query(
    `INSERT INTO deliverable_comments (deliverable_id, user_id, comment, is_revision_request)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.deliverableId, data.userId, data.comment, data.isRevisionRequest ?? false]
  );
  return result.rows[0];
}

export async function getDeliverableComments(deliverableId: string): Promise<DeliverableComment[]> {
  const result = await db.query(
    `SELECT dc.*, u.name as user_name FROM deliverable_comments dc
     LEFT JOIN users u ON dc.user_id = u.id
     WHERE dc.deliverable_id = $1 ORDER BY dc.created_at DESC`,
    [deliverableId]
  );
  return result.rows;
}

export async function getPlanItems(planId: string): Promise<PlanItem[]> {
  const result = await db.query(
    `SELECT * FROM plan_items WHERE plan_id = $1`,
    [planId]
  );
  return result.rows;
}

export async function getClientByToken(token: string): Promise<Client | null> {
  const result = await db.query(
    `SELECT * FROM clients WHERE token = $1`,
    [token]
  );
  return result.rows[0] || null;
}

// ============================================================
// Payment Transaction queries
// ============================================================

export async function createPaymentTransaction(data: {
  invoiceId: string;
  agencyId: string;
  providerId: string;
  amount: number;
  currency?: string;
  transactionId?: string;
  referenceId?: string;
  webhookPayload?: Record<string, any>;
}): Promise<PaymentTransaction> {
  const result = await db.query(
    `INSERT INTO payment_transactions
     (invoice_id, agency_id, provider_id, amount, currency, status, transaction_id, reference_id, webhook_payload)
     VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8)
     RETURNING *`,
    [
      data.invoiceId,
      data.agencyId,
      data.providerId,
      data.amount,
      data.currency || 'NPR',
      data.transactionId ?? null,
      data.referenceId ?? null,
      data.webhookPayload ? JSON.stringify(data.webhookPayload) : null,
    ]
  );
  return result.rows[0];
}

export async function updatePaymentTransactionStatus(
  id: string,
  agencyId: string,
  status: string
): Promise<PaymentTransaction> {
  const result = await db.query(
    `UPDATE payment_transactions
     SET status = $1, updated_at = NOW()
     WHERE id = $2 AND agency_id = $3
     RETURNING *`,
    [status, id, agencyId]
  );
  return result.rows[0];
}

export async function getPaymentTransactionsByInvoice(
  invoiceId: string,
  agencyId: string
): Promise<PaymentTransaction[]> {
  const result = await db.query(
    `SELECT * FROM payment_transactions
     WHERE invoice_id = $1 AND agency_id = $2
     ORDER BY created_at DESC`,
    [invoiceId, agencyId]
  );
  return result.rows;
}

// ============================================================
// Agency Payment Method queries
// ============================================================

export async function addAgencyPaymentMethod(data: {
  agencyId: string;
  providerId: string;
  credentials: Record<string, string>;
  testMode?: boolean;
}): Promise<AgencyPaymentMethod> {
  const result = await db.query(
    `INSERT INTO agency_payment_methods
     (agency_id, provider_id, credentials, enabled, test_mode)
     VALUES ($1, $2, $3, true, $4)
     RETURNING *`,
    [data.agencyId, data.providerId, JSON.stringify(data.credentials), data.testMode || false]
  );
  return result.rows[0];
}

export async function getAgencyPaymentMethods(agencyId: string): Promise<AgencyPaymentMethod[]> {
  const result = await db.query(
    `SELECT * FROM agency_payment_methods WHERE agency_id = $1 AND enabled = true`,
    [agencyId]
  );
  return result.rows;
}

export async function updateAgencyPaymentMethod(
  id: string,
  agencyId: string,
  data: { credentials?: Record<string, string>; enabled?: boolean }
): Promise<AgencyPaymentMethod> {
  const updates = [];
  const values: any[] = [id, agencyId];
  let paramCount = 2;

  if (data.credentials) {
    updates.push(`credentials = $${++paramCount}`);
    values.push(JSON.stringify(data.credentials));
  }

  if (data.enabled !== undefined) {
    updates.push(`enabled = $${++paramCount}`);
    values.push(data.enabled);
  }

  updates.push(`updated_at = NOW()`);

  const result = await db.query(
    `UPDATE agency_payment_methods
     SET ${updates.join(', ')}
     WHERE id = $1 AND agency_id = $2
     RETURNING *`,
    values
  );
  return result.rows[0];
}
