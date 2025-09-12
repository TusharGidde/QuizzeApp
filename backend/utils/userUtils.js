const bcrypt = require('bcryptjs');

async function comparePassword(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
}

function toJSON() {
  const values = { ...this.get() };
  delete values.password;
  delete values.deletedAt;
  return values;
}

module.exports = {
  comparePassword,
  toJSON
};