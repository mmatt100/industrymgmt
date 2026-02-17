import { Router } from 'express';
import { validatedHandler } from '../../middleware/validate';
import {
  contactBodySchema,
  contactIdParamsSchema,
} from './contact.schemas';
import {
  createContact,
  deleteContactById,
  getContactById,
  listContacts,
  updateContactById,
} from './contact.service';

const router = Router();

router.get(
  '/',
  validatedHandler({}, async (_req, res) => {
    const contacts = await listContacts();
    res.json(contacts);
  }),
);

router.get(
  '/:id',
  validatedHandler({ params: contactIdParamsSchema }, async (req, res) => {
    const { id } = req.params;
    const contact = await getContactById(id);
    res.json(contact);
  }),
);

router.post(
  '/',
  validatedHandler({ body: contactBodySchema }, async (req, res) => {
    const { name, email, phone } = req.body;

    const contact = await createContact({
      name,
      email,
      phone: phone ?? null,
    });

    res.status(201).json(contact);
  }),
);

router.put(
  '/:id',
  validatedHandler(
    { params: contactIdParamsSchema, body: contactBodySchema },
    async (req, res) => {
      const { id } = req.params;
      const { name, email, phone } = req.body;

      const contact = await updateContactById(id, {
        name,
        email,
        phone: phone ?? null,
      });

      res.json(contact);
    },
  ),
);

router.delete(
  '/:id',
  validatedHandler({ params: contactIdParamsSchema }, async (req, res) => {
    const { id } = req.params;
    await deleteContactById(id);

    res.status(204).end();
  }),
);

export default router;
