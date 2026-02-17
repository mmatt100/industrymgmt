import { getDb } from '../../lib/db';

export type Contact = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
};

type CreateContactInput = {
  name: string;
  email: string;
  phone: string | null;
};

type UpdateContactInput = {
  name: string;
  email: string;
  phone: string | null;
};

export const listContacts = async (): Promise<Contact[]> => {
  const db = getDb();
  return db
    .prepare('SELECT id, name, email, phone FROM contacts ORDER BY id ASC')
    .all() as Contact[];
};

export const getContactById = async (id: number): Promise<Contact | null> => {
  const db = getDb();
  const contact = db
    .prepare('SELECT id, name, email, phone FROM contacts WHERE id = ?')
    .get(id) as Contact | undefined;
  return contact ?? null;
};

export const createContact = async (
  input: CreateContactInput,
): Promise<Contact | null> => {
  const db = getDb();
  const result = db
    .prepare('INSERT INTO contacts (name, email, phone) VALUES (?, ?, ?)')
    .run(input.name, input.email, input.phone);

  const id = Number(result.lastInsertRowid);
  const contact = db
    .prepare('SELECT id, name, email, phone FROM contacts WHERE id = ?')
    .get(id) as Contact | undefined;

  return contact ?? null;
};

export const updateContactById = async (
  id: number,
  input: UpdateContactInput,
): Promise<Contact | null> => {
  const db = getDb();
  const result = db
    .prepare('UPDATE contacts SET name = ?, email = ?, phone = ? WHERE id = ?')
    .run(input.name, input.email, input.phone, id);

  if (result.changes === 0) {
    return null;
  }

  const contact = db
    .prepare('SELECT id, name, email, phone FROM contacts WHERE id = ?')
    .get(id) as Contact | undefined;

  return contact ?? null;
};

export const deleteContactById = async (id: number): Promise<boolean> => {
  const db = getDb();
  const result = db
    .prepare('DELETE FROM contacts WHERE id = ?')
    .run(id);
  return result.changes > 0;
};
