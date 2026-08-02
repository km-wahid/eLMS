const COVER_BY_CODE = {
  CSE: '/images/departments/cse.jpg',
  EEE: '/images/departments/eee.jpg',
  CE: '/images/departments/ce.jpg',
  ME: '/images/departments/me.jpg',
  BBA: '/images/departments/bba.jpg',
  ENG: '/images/departments/eng.jpg',
  ECO: '/images/departments/eco.jpg',
  LAW: '/images/departments/law.jpg',
};

export function departmentCover(code) {
  return COVER_BY_CODE[String(code || '').toUpperCase()] || '/images/departments/cse.jpg';
}
