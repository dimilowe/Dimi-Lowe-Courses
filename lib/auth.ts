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

type UsersSchemaSupport = {
  hasIsAdmin: boolean;
  hasSubscriptionTier: boolean;
};

type ProfilesSchemaSupport = {
  hasUserIdColumn: boolean;
  hasIdColumn: boolean;
};

let usersSchemaSupportPromise: Promise<UsersSchemaSupport> | null = null;
let profilesSchemaSupportPromise: Promise<ProfilesSchemaSupport> | null = null;

async function getUsersSchemaSupport(): Promise<UsersSchemaSupport> {
  if (!usersSchemaSupportPromise) {
    usersSchemaSupportPromise = query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'users'
         AND column_name IN ('is_admin', 'subscription_tier')`
    )
      .then((result) => {
        const columns = new Set(
          result.rows
            .map((row: { column_name?: string }) => String(row.column_name || '').toLowerCase())
            .filter(Boolean)
        );
        return {
          hasIsAdmin: columns.has('is_admin'),
          hasSubscriptionTier: columns.has('subscription_tier'),
        };
      })
      .catch((error) => {
        usersSchemaSupportPromise = null;
        throw error;
      });
  }

  return usersSchemaSupportPromise;
}

async function getProfilesSchemaSupport(): Promise<ProfilesSchemaSupport> {
  if (!profilesSchemaSupportPromise) {
    profilesSchemaSupportPromise = query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'profiles'
         AND column_name IN ('user_id', 'id')`
    )
      .then((result) => {
        const columns = new Set(
          result.rows
            .map((row: { column_name?: string }) => String(row.column_name || '').toLowerCase())
            .filter(Boolean)
        );
        return {
          hasUserIdColumn: columns.has('user_id'),
          hasIdColumn: columns.has('id'),
        };
      })
      .catch((error) => {
        profilesSchemaSupportPromise = null;
        throw error;
      });
  }

  return profilesSchemaSupportPromise;
}

function mapUserRow(
  row: any,
  schema: UsersSchemaSupport
): User {
  const rawTier = schema.hasSubscriptionTier ? row.subscription_tier : null;
  const subscriptionTier =
    typeof rawTier === 'string' && rawTier.trim().length > 0
      ? (rawTier as SubscriptionTier)
      : ('free' as SubscriptionTier);

  return {
    id: String(row.id),
    email: String(row.email),
    created_at: row.created_at,
    is_admin: schema.hasIsAdmin ? Boolean(row.is_admin) : false,
    subscription_tier: subscriptionTier,
  };
}

async function ensureProfileRow(userId: string, normalizedEmail: string): Promise<void> {
  try {
    const profileSchema = await getProfilesSchemaSupport();
    const displayName = normalizedEmail.split('@')[0];

    if (profileSchema.hasUserIdColumn) {
      await query(
        'INSERT INTO profiles (user_id, display_name) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING',
        [userId, displayName]
      );
      return;
    }

    if (profileSchema.hasIdColumn) {
      await query(
        'INSERT INTO profiles (id, display_name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
        [userId, displayName]
      );
    }
  } catch (profileError) {
    // Profile bootstrap should never block auth success.
    console.error('Failed to ensure profile row:', profileError);
  }
}

export async function createUser(email: string, password: string): Promise<User> {
  const normalizedEmail = normalizeEmail(email);
  const passwordHash = await bcrypt.hash(password, 10);
  const userSchema = await getUsersSchemaSupport();
  const returningColumns = userSchema.hasSubscriptionTier
    ? 'id, email, created_at, subscription_tier'
    : 'id, email, created_at';

  const result = await query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING ${returningColumns}`,
    [normalizedEmail, passwordHash]
  );

  const user = result.rows[0];
  const mapped = mapUserRow(user, userSchema);

  await ensureProfileRow(mapped.id, normalizedEmail);

  return mapped;
}

export async function verifyPassword(email: string, password: string): Promise<User | null> {
  const normalizedEmail = normalizeEmail(email);
  const userSchema = await getUsersSchemaSupport();
  const selectedColumns = [
    'id',
    'email',
    'password_hash',
    'created_at',
    ...(userSchema.hasIsAdmin ? ['is_admin'] : []),
    ...(userSchema.hasSubscriptionTier ? ['subscription_tier'] : []),
  ].join(', ');

  const result = await query(
    `SELECT ${selectedColumns} FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [normalizedEmail]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const user = result.rows[0];
  const passwordHash = typeof user.password_hash === 'string' ? user.password_hash : '';
  if (!passwordHash) {
    return null;
  }

  let isValid = false;
  try {
    isValid = await bcrypt.compare(password, passwordHash);
  } catch (error) {
    console.error('Password verification failed:', error);
    return null;
  }
  
  if (!isValid) {
    return null;
  }
  
  return mapUserRow(user, userSchema);
}

export async function findOrCreateUserByEmail(email: string): Promise<User> {
  const normalizedEmail = normalizeEmail(email);
  const userSchema = await getUsersSchemaSupport();
  const selectedColumns = [
    'id',
    'email',
    'created_at',
    ...(userSchema.hasIsAdmin ? ['is_admin'] : []),
    ...(userSchema.hasSubscriptionTier ? ['subscription_tier'] : []),
  ].join(', ');

  const result = await query(
    `SELECT ${selectedColumns} FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [normalizedEmail]
  );
  
  if (result.rows.length > 0) {
    return mapUserRow(result.rows[0], userSchema);
  }

  const returningColumns = userSchema.hasSubscriptionTier
    ? 'id, email, created_at, subscription_tier'
    : 'id, email, created_at';

  const newUserResult = await query(
    `INSERT INTO users (email) VALUES ($1) RETURNING ${returningColumns}`,
    [normalizedEmail]
  );

  const mapped = mapUserRow(newUserResult.rows[0], userSchema);
  await ensureProfileRow(mapped.id, normalizedEmail);
  return mapped;
}
