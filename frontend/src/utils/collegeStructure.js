export const COLLEGE_STRUCTURE = {
  "Computer Science": {
    1: ["A", "B", "C", "D"],
    2: ["A", "B", "C", "D"],
    3: ["A", "B", "C", "D"],
    4: ["A", "B", "C", "D"]
  },
  "Information Science": {
    1: ["A", "B", "C"],
    2: ["A", "B", "C"],
    3: ["A", "B", "C"],
    4: ["A", "B", "C"]
  },
  "Electronics": {
    1: ["A", "B"],
    2: ["A", "B"],
    3: ["A", "B"],
    4: ["A", "B"]
  },
  "Mechanical": {
    1: ["A"],
    2: ["A"],
    3: ["A"],
    4: ["A"]
  }
};

// Helper function to get all departments
export const getDepartments = () => {
  return Object.keys(COLLEGE_STRUCTURE);
};

// Helper function to get available sections for a specific department and year
export const getSections = (department, year) => {
  if (!department || !year || !COLLEGE_STRUCTURE[department]) return [];
  return COLLEGE_STRUCTURE[department][year] || [];
};

// Helper function to get all available unique sections across multiple departments and years
export const getAvailableSectionsForMultiple = (departments, years) => {
  const sections = new Set();
  departments.forEach(dept => {
    years.forEach(year => {
      const secs = getSections(dept, year);
      secs.forEach(s => sections.add(s));
    });
  });
  return Array.from(sections).sort();
};

// Helper function to generate eligibility triplets (department, year, section)
export const generateEligibilityTriplets = (departments, years, sections = null) => {
  const triplets = [];
  departments.forEach(dept => {
    years.forEach(year => {
      // Get the valid sections for this exact department and year combination
      const validSecsForCombo = getSections(dept, year);
      
      const secsToUse = sections ? validSecsForCombo.filter(s => sections.includes(s)) : validSecsForCombo;
      
      secsToUse.forEach(sec => {
        triplets.push({ department: dept, year, section: sec });
      });
    });
  });
  return triplets;
};
