

function isExpired() {
  return this.expiresAt && new Date() > this.expiresAt;
}

function isActive() {
  return !this.deletedAt && !this.isExpired();
}

function toJSON() {
  const values = { ...this.get() };
  delete values.deletedAt;
  return {
    ...values,
    isExpired: this.isExpired(),
    isActive: this.isActive()
  };
}

module.exports = {
  toJSON,
  isExpired,
  isActive
};
