const express = require('express');
const postgres = require('postgres');
const env = require('dotenv').config();
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const { v4: uuidValidate } = require('uuid-validate');

const app = express();
app.use(cors());
app.use(express.json());

const sql = postgres(process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/stock_manager');

const validateUUID = (req, res, next) => {
    const { uuid } = req.params;
    if (!uuidValidate(uuid)) {
        return res.status(400).json({ error: 'Invalid UUID' });
    }
    next();
};

app.post('/api/categories', [
    body('category_name').notEmpty().withMessage('Category name is required'), 
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { category_name } = req.body; 
    try {
        const category = await sql`
            INSERT INTO component_manager.category (category_name)
            VALUES (${category_name})
            RETURNING *;
        `;
        res.status(201).json(category);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create category', details: err.message });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const categories = await sql`SELECT * FROM component_manager.category;`;
        res.status(200).json(categories);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch categories', details: err.message });
    }
});

app.put('/api/categories/:uuid', validateUUID, [
    body('category_name').notEmpty().withMessage('Category name is required'), 
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { uuid } = req.params;
    const { category_name } = req.body; 
    try {
        const category = await sql`
            UPDATE component_manager.category
            SET category_name = ${category_name}
            WHERE uuid = ${uuid}
            RETURNING *;
        `;
        if (category.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.status(200).json(category);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update category', details: err.message });
    }
});

app.delete('/api/categories/:uuid', validateUUID, async (req, res) => {
    const { uuid } = req.params;
    try {
        const result = await sql`DELETE FROM component_manager.category WHERE uuid = ${uuid} RETURNING *;`;
        if (result.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete category', details: err.message });
    }
});


app.post('/api/sub-categories', [
    body('sub_category_name').notEmpty().withMessage('Sub-category name is required'), 
    body('parent').notEmpty().withMessage('Parent category UUID is required'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { sub_category_name, parent } = req.body; 
    try {
        const subCategory = await sql`
            INSERT INTO component_manager.sub_category (sub_category_name, parent)
            VALUES (${sub_category_name}, ${parent})
            RETURNING *;
        `;
        res.status(201).json(subCategory);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create sub-category', details: err.message });
    }
});

app.get('/api/sub-categories/:uuid', validateUUID, async (req, res) => {
    const { uuid } = req.params;
    try {
        const subCategories = await sql`SELECT * FROM component_manager.sub_category WHERE parent = ${uuid};`;
        res.status(200).json(subCategories);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch sub-categories', details: err.message });
    }
});


app.put('/api/sub-categories/:uuid', validateUUID, [
    body('sub_category_name').notEmpty().withMessage('Sub-category name is required'), 
    body('parent').notEmpty().withMessage('Parent category UUID is required'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { uuid } = req.params;
    const { sub_category_name, parent } = req.body; 
    try {
        const subCategory = await sql`
            UPDATE component_manager.sub_category
            SET sub_category_name = ${sub_category_name}, parent = ${parent}
            WHERE uuid = ${uuid}
            RETURNING *;
        `;
        if (subCategory.length === 0) {
            return res.status(404).json({ error: 'Sub-category not found' });
        }
        res.status(200).json(subCategory);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update sub-category', details: err.message });
    }
});

app.delete('/api/sub-categories/:uuid', validateUUID, async (req, res) => {
    const { uuid } = req.params;
    try {
        const result = await sql`DELETE FROM component_manager.sub_category WHERE uuid = ${uuid} RETURNING *;`;
        if (result.length === 0) {
            return res.status(404).json({ error: 'Sub-category not found' });
        }
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete sub-category', details: err.message });
    }
});

app.post('/api/components', [
    body('reference').notEmpty().withMessage('Reference is required'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('date_checked').isISO8601().withMessage('Date must be in ISO8601 format'),
    body('category').notEmpty().withMessage('Category UUID is required'),
    body('sub_category').notEmpty().withMessage('Sub-category UUID is required'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { reference, quantity, date_checked, category, sub_category } = req.body;
    try {
        const component = await sql`
            INSERT INTO component_manager.component (reference, quantity, date_checked, category, sub_category)
            VALUES (${reference}, ${quantity}, ${date_checked}, ${category}, ${sub_category})
            RETURNING *;
        `;
        res.status(201).json(component);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create component', details: err.message });
    }
});

app.get('/api/components', async (req, res) => {
    try {
        const components = await sql`SELECT * FROM component_manager.component;`;
        res.status(200).json(components);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch components', details: err.message });
    }
});

app.get('/api/components/category/:uuid', validateUUID, async (req, res) => {
    const { uuid } = req.params;
    try {
        const components = await sql`SELECT * FROM component_manager.component WHERE category = ${uuid};`;
        res.status(200).json(components);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch components by category', details: err.message });
    }
});

app.get('/api/components/sub-category/:uuid', validateUUID, async (req, res) => {
    const { uuid } = req.params;
    try {
        const components = await sql`SELECT * FROM component_manager.component WHERE sub_category = ${uuid};`;
        res.status(200).json(components);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch components by sub-category', details: err.message });
    }
});

app.put('/api/components/:uuid', validateUUID, [
    body('reference').notEmpty().withMessage('Reference is required'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('date_checked').isISO8601().withMessage('Date must be in ISO8601 format'),
    body('category').notEmpty().withMessage('Category UUID is required'),
    body('sub_category').notEmpty().withMessage('Sub-category UUID is required'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { uuid } = req.params;
    const { reference, quantity, date_checked, category, sub_category } = req.body;
    try {
        const component = await sql`
            UPDATE component_manager.component
            SET reference = ${reference}, quantity = ${quantity}, date_checked = ${date_checked}, category = ${category}, sub_category = ${sub_category}
            WHERE uuid = ${uuid}
            RETURNING *;
        `;
        if (component.length === 0) {
            return res.status(404).json({ error: 'Component not found' });
        }
        res.status(200).json(component);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update component', details: err.message });
    }
});

app.delete('/api/components/:uuid', validateUUID, async (req, res) => {
    const { uuid } = req.params;
    try {
        const result = await sql`DELETE FROM component_manager.component WHERE uuid = ${uuid} RETURNING *;`;
        if (result.length === 0) {
            return res.status(404).json({ error: 'Component not found' });
        }
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete component', details: err.message });
    }
});

app.post('/api/sub-components', [
    body('super_uuid').notEmpty().withMessage('Super UUID is required'),
    body('place').notEmpty().withMessage('Place is required'), 
    body('note').optional().isString().withMessage('Note must be a string'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { super_uuid, place, note } = req.body;
    try {
        const subComponent = await sql`
            INSERT INTO component_manager.sub_component (super_uuid, place, note)
            VALUES (${super_uuid}, ${place}, ${note})
            RETURNING *;
        `;
        res.status(201).json(subComponent);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create sub-component', details: err.message });
    }
});

app.get('/api/sub-components/component/:uuid', validateUUID, async (req, res) => {
    const { uuid } = req.params;
    try {
        const subComponents = await sql`SELECT * FROM component_manager.sub_component WHERE super_uuid = ${uuid};`;
        res.status(200).json(subComponents);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch sub-components', details: err.message });
    }
});

app.put('/api/sub-components/:uuid', validateUUID, [
    body('super_uuid').notEmpty().withMessage('Super UUID is required'),
    body('place').notEmpty().withMessage('Place is required'), 
    body('note').optional().isString().withMessage('Note must be a string'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { uuid } = req.params;
    const { super_uuid, place, note } = req.body;
    try {
        const subComponent = await sql`
            UPDATE component_manager.sub_component
            SET super_uuid = ${super_uuid}, place = ${place}, note = ${note}
            WHERE uuid = ${uuid}
            RETURNING *;
        `;
        if (subComponent.length === 0) {
            return res.status(404).json({ error: 'Sub-component not found' });
        }
        res.status(200).json(subComponent);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update sub-component', details: err.message });
    }
});

app.delete('/api/sub-components/:uuid', validateUUID, async (req, res) => {
    const { uuid } = req.params;
    try {
        const result = await sql`DELETE FROM component_manager.sub_component WHERE uuid = ${uuid} RETURNING *;`;
        if (result.length === 0) {
            return res.status(404).json({ error: 'Sub-component not found' });
        }
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete sub-component', details: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
