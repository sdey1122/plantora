/**
 * Mask MongoDB ObjectId.
 * Example: 6899bc67f2b91b5db16a1234 -> 68****1234
 */

const maskId = (id) => {
  if (!id) {
    return "";
  }

  const value = id.toString();

  if (value.length <= 6) {
    return value;
  }

  return `${value.slice(0, 2)}****${value.slice(-4)}`;
};

module.exports = maskId;
