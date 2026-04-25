const prisma = require('../prisma/client');

const getSectors = async (req, res) => {
  try {
    const sectors = await prisma.sector.findMany({
      where: { companyId: req.user.companyId },
      include: {
        _count: {
          select: { employees: true }
        }
      }
    });

    // Format for frontend (flattening _count)
    const formattedSectors = sectors.map(s => ({
      ...s,
      employeeCount: s._count.employees
    }));

    res.json(formattedSectors);
  } catch (err) {
    console.error('Get Sectors Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const createSector = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Sector name is required' });

  try {
    const existing = await prisma.sector.findUnique({
      where: {
        name_companyId: {
          name,
          companyId: req.user.companyId
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Sector already exists in this company' });
    }

    const sector = await prisma.sector.create({
      data: {
        name,
        companyId: req.user.companyId
      }
    });

    res.status(201).json(sector);
  } catch (err) {
    console.error('Create Sector Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const deleteSector = async (req, res) => {
  const { id } = req.params;

  try {
    // Ensure the sector belongs to the user's company
    const sector = await prisma.sector.findFirst({
      where: { id, companyId: req.user.companyId }
    });

    if (!sector) return res.status(404).json({ error: 'Sector not found' });

    // Detach employees from this sector first to avoid foreign key issues
    await prisma.user.updateMany({
        where: { sectorId: id },
        data: { sectorId: null }
    });

    await prisma.sector.delete({ where: { id } });
    res.json({ message: 'Sector deleted successfully' });
  } catch (err) {
    console.error('Delete Sector Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const updateSector = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) return res.status(400).json({ error: 'Sector name is required' });

  try {
    const updated = await prisma.sector.update({
      where: { 
        id,
        companyId: req.user.companyId 
      },
      data: { name }
    });

    res.json(updated);
  } catch (err) {
    console.error('Update Sector Error:', err);
    res.status(500).json({ error: 'Failed to update sector' });
  }
};

module.exports = { getSectors, createSector, deleteSector, updateSector };
