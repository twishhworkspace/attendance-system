const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const checkInSchema = z.object({
  location: z.string().regex(/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/, 'Invalid coordinates format (lat,lng)'),
  accuracy: z.number().min(0).max(5000).optional(),
  photoUrl: z.string().url().optional(),
});

const checkOutSchema = z.object({
  location: z.string().regex(/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/, 'Invalid coordinates format (lat,lng)'),
  accuracy: z.number().min(0).max(5000).optional(),
});

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    return res.status(400).json({ 
      error: 'Validation Failed', 
      details: err.errors.map(e => ({ path: e.path, message: e.message })) 
    });
  }
};

module.exports = {
  loginSchema,
  checkInSchema,
  checkOutSchema,
  validate
};
