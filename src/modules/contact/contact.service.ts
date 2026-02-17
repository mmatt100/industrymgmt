import {
  createContact as createContactRepo,
  deleteContactById as deleteContactByIdRepo,
  getContactById as getContactByIdRepo,
  listContacts as listContactsRepo,
  updateContactById as updateContactByIdRepo,
  type Contact,
} from './contact.repository';
import { InternalError, NotFoundError } from '../../errors/app-error';

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
  return listContactsRepo();
};

export const getContactById = async (id: number): Promise<Contact> => {
  const contact = await getContactByIdRepo(id);
  if (!contact) {
    throw new NotFoundError('Contact not found');
  }
  return contact;
};

export const createContact = async (
  input: CreateContactInput,
): Promise<Contact> => {
  const contact = await createContactRepo(input);
  if (!contact) {
    throw new InternalError('Failed to create contact');
  }
  return contact;
};

export const updateContactById = async (
  id: number,
  input: UpdateContactInput,
): Promise<Contact> => {
  const contact = await updateContactByIdRepo(id, input);
  if (!contact) {
    throw new NotFoundError('Contact not found');
  }
  return contact;
};

export const deleteContactById = async (id: number): Promise<void> => {
  const deleted = await deleteContactByIdRepo(id);
  if (!deleted) {
    throw new NotFoundError('Contact not found');
  }
};
