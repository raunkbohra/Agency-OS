import { db } from './db';

// Type definitions
export interface Agency {
  id: string;
  name: string;
  owner_id: string;
  currency: string;
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

export async function getAgencyById(id: string): Promise<Agency | null> {
  try {
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

    if (fields.length === 0) return getClientById(id);

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
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  rate: string;
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
      'SELECT * FROM invoices WHERE agency_id = $1 ORDER BY created_at DESC',
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

export async function getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
  try {
    const result = await db.query(
      'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at DESC',
      [invoiceId]
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
    const result = await db.query(
      pdfUrl
        ? 'UPDATE invoices SET status = $1, pdf_url = $2, updated_at = NOW() WHERE id = $3 AND agency_id = $4 RETURNING *'
        : 'UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2 AND agency_id = $3 RETURNING *',
      pdfUrl ? [status, pdfUrl, invoiceId, agencyId] : [status, invoiceId, agencyId]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error('Failed to update invoice status:', err);
    throw new Error(`Failed to update invoice status: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}
