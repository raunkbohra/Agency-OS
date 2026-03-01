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
  const result = await db.query(
    'INSERT INTO agencies (name, owner_id, currency) VALUES ($1, $2, $3) RETURNING *',
    [name, ownerId, currency]
  );
  return result.rows[0];
}

export async function getAgencyById(id: string): Promise<Agency | null> {
  const result = await db.query('SELECT * FROM agencies WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getAgenciesByOwnerId(ownerId: string): Promise<Agency[]> {
  const result = await db.query(
    'SELECT * FROM agencies WHERE owner_id = $1 ORDER BY created_at DESC',
    [ownerId]
  );
  return result.rows;
}

// User queries
export async function createUser(
  agencyId: string,
  email: string,
  name: string,
  role: string = 'member'
): Promise<User> {
  const result = await db.query(
    'INSERT INTO users (agency_id, email, name, role) VALUES ($1, $2, $3, $4) RETURNING *',
    [agencyId, email, name, role]
  );
  return result.rows[0];
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getUsersByAgency(agencyId: string): Promise<User[]> {
  const result = await db.query(
    'SELECT * FROM users WHERE agency_id = $1 ORDER BY created_at DESC',
    [agencyId]
  );
  return result.rows;
}

// Plan queries
export async function createPlan(
  agencyId: string,
  name: string,
  price: number,
  billingCycle: string = 'monthly',
  description?: string
): Promise<Plan> {
  const result = await db.query(
    'INSERT INTO plans (agency_id, name, price, billing_cycle, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [agencyId, name, price, billingCycle, description || null]
  );
  return result.rows[0];
}

export async function getPlanById(id: string): Promise<Plan | null> {
  const result = await db.query('SELECT * FROM plans WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getPlansByAgency(agencyId: string): Promise<Plan[]> {
  const result = await db.query(
    'SELECT * FROM plans WHERE agency_id = $1 ORDER BY created_at DESC',
    [agencyId]
  );
  return result.rows;
}

export async function updatePlan(
  id: string,
  name?: string,
  price?: number,
  billingCycle?: string,
  description?: string
): Promise<Plan | null> {
  const fields: string[] = [];
  const values: any[] = [];
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

  if (fields.length === 0) return getPlanById(id);

  values.push(id);
  const query = `UPDATE plans SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  const result = await db.query(query, values);
  return result.rows[0] || null;
}

export async function deletePlan(id: string): Promise<boolean> {
  const result = await db.query('DELETE FROM plans WHERE id = $1', [id]);
  return result.rowCount! > 0;
}

// Plan items queries
export async function createPlanItem(
  planId: string,
  deliverableType: string,
  qty: number = 1,
  recurrence: string = 'monthly'
): Promise<PlanItem> {
  const result = await db.query(
    'INSERT INTO plan_items (plan_id, deliverable_type, qty, recurrence) VALUES ($1, $2, $3, $4) RETURNING *',
    [planId, deliverableType, qty, recurrence]
  );
  return result.rows[0];
}

export async function getPlanItemsByPlan(planId: string): Promise<PlanItem[]> {
  const result = await db.query(
    'SELECT * FROM plan_items WHERE plan_id = $1 ORDER BY created_at DESC',
    [planId]
  );
  return result.rows;
}

// Client queries
export async function createClient(
  agencyId: string,
  name: string,
  email: string,
  phone?: string,
  companyName?: string
): Promise<Client> {
  const result = await db.query(
    'INSERT INTO clients (agency_id, name, email, phone, company_name) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [agencyId, name, email, phone || null, companyName || null]
  );
  return result.rows[0];
}

export async function getClientById(id: string): Promise<Client | null> {
  const result = await db.query('SELECT * FROM clients WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getClientsByAgency(agencyId: string): Promise<Client[]> {
  const result = await db.query(
    'SELECT * FROM clients WHERE agency_id = $1 ORDER BY created_at DESC',
    [agencyId]
  );
  return result.rows;
}

export async function updateClient(
  id: string,
  name?: string,
  email?: string,
  phone?: string,
  companyName?: string
): Promise<Client | null> {
  const fields: string[] = [];
  const values: any[] = [];
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
  const query = `UPDATE clients SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  const result = await db.query(query, values);
  return result.rows[0] || null;
}

// Client plans (subscriptions) queries
export async function createClientPlan(
  clientId: string,
  planId: string,
  status: string = 'active'
): Promise<ClientPlan> {
  const result = await db.query(
    'INSERT INTO client_plans (client_id, plan_id, status) VALUES ($1, $2, $3) RETURNING *',
    [clientId, planId, status]
  );
  return result.rows[0];
}

export async function getClientPlanById(id: string): Promise<ClientPlan | null> {
  const result = await db.query('SELECT * FROM client_plans WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getClientPlansByClient(clientId: string): Promise<ClientPlan[]> {
  const result = await db.query(
    'SELECT * FROM client_plans WHERE client_id = $1 ORDER BY created_at DESC',
    [clientId]
  );
  return result.rows;
}

export async function updateClientPlanStatus(
  id: string,
  status: string
): Promise<ClientPlan | null> {
  const result = await db.query(
    'UPDATE client_plans SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0] || null;
}

export async function deleteClientPlan(id: string): Promise<boolean> {
  const result = await db.query('DELETE FROM client_plans WHERE id = $1', [id]);
  return result.rowCount! > 0;
}
