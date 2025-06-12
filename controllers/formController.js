const db = require('../config/db');

async function createForm(req, res) {
  const { title, fields } = req.body;
  const created_by = req.user.id;
  const code = Math.random().toString(36).substring(2, 8);
  const [form] = await db.query('INSERT INTO Forms (title, created_by, code) VALUES (?, ?, ?)', [title, created_by, code]);
  const formId = form.insertId;

  for (let field of fields) {
    await db.query('INSERT INTO Fields (form_id, label, type, options) VALUES (?, ?, ?, ?)', [formId, field.label, field.type, JSON.stringify(field.options || [])]);
  }

  res.json({ formId, code });
}

async function getFormByCode(req, res) {
  const [formRows] = await db.query('SELECT * FROM Forms WHERE code = ?', [req.params.code]);
  if (formRows.length === 0) return res.status(404).json({ error: 'Form not found' });

  const form = formRows[0];
  const [fields] = await db.query('SELECT * FROM Fields WHERE form_id = ?', [form.id]);

  res.json({ form, fields });
}

module.exports = { createForm, getFormByCode };