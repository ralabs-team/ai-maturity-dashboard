function splitCommaSeparatedValues(rawValue: string): string[] {
  return rawValue
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

const PROJECT_ALIASES: Record<string, string> = {
  OPERA: 'RMSL Opera',
  OPERAi: 'RMSL Opera',
  Clover: 'RMSL Clover',
};

function normalizeProject(name: string): string {
  return PROJECT_ALIASES[name] || name;
}

function isSameName(left: string, right: string): boolean {
  return left.localeCompare(right, undefined, { sensitivity: 'base' }) === 0;
}

export function nameFromEmail(email: string): string {
  const local = email.split('@')[0];
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function allProjectsList(projectsField: string): string[] {
  if (!projectsField) return ['Unassigned'];
  const cleaned = projectsField.replace(/^[A-Z]+:\s*/, '');
  const parts = splitCommaSeparatedValues(cleaned);
  if (parts.length === 0) return ['Unassigned'];
  return Array.from(new Set(parts.map(normalizeProject)));
}

export function primaryProject(projectsField: string): string {
  return allProjectsList(projectsField)[0];
}

export function allDepartmentsList(departmentsField: string): string[] {
  if (!departmentsField) return ['Unassigned'];
  const parts = splitCommaSeparatedValues(departmentsField);
  if (parts.length === 0) return ['Unassigned'];
  return Array.from(new Set(parts));
}

export function primaryDepartment(departmentsField: string): string {
  return allDepartmentsList(departmentsField)[0];
}

export function renameProjectInProjectsField(
  projectsField: string,
  previousName: string,
  nextName: string,
): string {
  const sanitizedPreviousName = previousName.trim();
  const sanitizedNextName = nextName.trim().replace(/\s+/g, ' ');

  if (!sanitizedPreviousName || !sanitizedNextName) {
    return projectsField;
  }

  const prefixMatch = projectsField.match(/^([A-Z]+:\s*)/);
  const prefix = prefixMatch?.[1] ?? '';
  const cleanedProjectsField = prefix ? projectsField.slice(prefix.length) : projectsField;
  const projectParts = cleanedProjectsField
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (projectParts.length === 0) {
    return projectsField;
  }

  let hasChanges = false;

  const renamedProjects = projectParts.map((projectName) => {
    if (!isSameName(normalizeProject(projectName), sanitizedPreviousName)) {
      return projectName;
    }

    hasChanges = true;
    return sanitizedNextName;
  });

  return hasChanges ? `${prefix}${renamedProjects.join(', ')}` : projectsField;
}

export function renameDepartmentInDepartmentsField(
  departmentsField: string,
  previousName: string,
  nextName: string,
): string {
  const sanitizedPreviousName = previousName.trim();
  const sanitizedNextName = nextName.trim().replace(/\s+/g, ' ');

  if (!sanitizedPreviousName || !sanitizedNextName) {
    return departmentsField;
  }

  const departmentParts = splitCommaSeparatedValues(departmentsField);

  if (departmentParts.length === 0) {
    return departmentsField;
  }

  let hasChanges = false;

  const renamedDepartments = departmentParts.map((departmentName) => {
    if (!isSameName(departmentName, sanitizedPreviousName)) {
      return departmentName;
    }

    hasChanges = true;
    return sanitizedNextName;
  });

  return hasChanges ? Array.from(new Set(renamedDepartments)).join(', ') : departmentsField;
}

export function roleFromDepartment(dept: string): string {
  const primaryDept = primaryDepartment(dept);
  const map: Record<string, string> = {
    'Software Engineering': 'Engineer',
    'Quality Assurance (Manual / Automated)': 'QA Engineer',
    DevOps: 'DevOps',
    'Design (UI/UX)': 'Designer',
    'Data Analyst': 'Data Analyst',
  };
  return map[primaryDept] || primaryDept;
}
