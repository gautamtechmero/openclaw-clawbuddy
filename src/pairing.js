/**
 * Pairing key generation and validation
 * 
 * The pairing key is a base64-encoded JSON payload prefixed with "CB-"
 * This key contains everything the app needs to connect to this instance.
 */

function generatePairingKey(pairingData) {
  const json = JSON.stringify(pairingData);
  const base64 = Buffer.from(json).toString('base64');
  return `CB-${base64}`;
}

function decodePairingKey(pairingKey) {
  if (!pairingKey.startsWith('CB-')) {
    throw new Error('Invalid pairing key format — must start with CB-');
  }
  const base64 = pairingKey.substring(3);
  const json = Buffer.from(base64, 'base64').toString('utf-8');
  return JSON.parse(json);
}

function validatePairingKey(pairingKey) {
  try {
    const data = decodePairingKey(pairingKey);
    return !!(data.version && data.instanceId && data.auth && data.connections);
  } catch {
    return false;
  }
}

module.exports = {
  generatePairingKey,
  decodePairingKey,
  validatePairingKey,
};
