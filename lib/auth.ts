import { query } from './db';
import bcrypt from 'bcryptjs';
import type { SubscriptionTier } from './pricing/types';

export interface User {
  id: string;
  email: string;
  created_at: Date;
  is_admin?: boolean;
  subscription_tier: SubscriptionTier;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function createUser(email: string, password: string): Promise<User> {
  const normalizedEmail = normalizeEmail(email);
  const passwordHash = await bcrypt.hash(password, 10);
  
  const result = await query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at, subscription_tier',
    [normalizedEmail, passwordHash]
  );
  
  const user = result.rows[0];
  
  await query(
    'INSERT INTO profiles (id, display_name) VALUES ($1, $2)',
    [user.id, normalizedEmail.split('@')[0]]
  );
  
  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    subscription_tier: user.subscription_tier || 'free',
  };
}

export async function verifyPassword(email: string, password: string): Promise<User | null> {
  const normalizedEmail = normalizeEmail(email);
  const result = await query(
    'SELECT id, email, password_hash, created_at, is_admin, subscription_tier FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [normalizedEmail]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const user = result.rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);
  
  if (!isValid) {
    return null;
  }
  
  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    is_admin: user.is_admin,
    subscription_tier: user.subscription_tier || 'free',
  };
}

export async function findOrCreateUserByEmail(email: string): Promise<User> {
  const normalizedEmail = normalizeEmail(email);
  const result = await query(
    'SELECT id, email, created_at, subscription_tier FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [normalizedEmail]
  );
  
  if (result.rows.length > 0) {
    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      subscription_tier: user.subscription_tier || 'free',
    };
  }
  
  const newUserResult = await query(
    'INSERT INTO users (email) VALUES ($1) RETURNING id, email, created_at, subscription_tier',
    [normalizedEmail]
  );
  
  const user = newUserResult.rows[0];
  
  await query(
    'INSERT INTO profiles (id, display_name) VALUES ($1, $2)',
    [user.id, normalizedEmail.split('@')[0]]
  );
  
  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    subscription_tier: user.subscription_tier || 'free',
  };
}
