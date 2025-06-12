const db = require('../config/db');

async function createForm(req, res) {
  try {
    const { title, fields } = req.body;
    if (!title || !Array.isArray(fields)) {
      return res.status(400).json({ error: 'Invalid form data' });
    }
    const created_by = req.user.id;
    const code = Math.random().toString(36).substring(2, 8);

    // Start transaction
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [form] = await conn.query(
        'INSERT INTO Forms (title, created_by, code) VALUES (?, ?, ?)',
        [title, created_by, code]
      );
      const formId = form.insertId;

      for (let field of fields) {
        await conn.query(
          'INSERT INTO Fields (form_id, label, type, options) VALUES (?, ?, ?, ?)',
          [formId, field.label, field.type, JSON.stringify(field.options || [])]
        );
      }

      await conn.commit();
      res.json({ formId, code });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Create form error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getFormByCode(req, res) {
  try {
    const [formRows] = await db.query('SELECT * FROM Forms WHERE code = ?', [req.params.code]);
    if (formRows.length === 0) return res.status(404).json({ error: 'Form not found' });

    const form = formRows[0];
    const [fields] = await db.query('SELECT * FROM Fields WHERE form_id = ?', [form.id]);

    res.json({ form, fields });
  } catch (err) {
    console.error('Get form error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { createForm, getFormByCode };
