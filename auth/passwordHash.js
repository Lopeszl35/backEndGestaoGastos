// auth/passwordHash.js
import argon2 from 'argon2';
import bcrypt from 'bcrypt';

const ARGON2_CONFIG = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16, // 64 MB
  timeCost: 3,
  parallelism: 1
};

export async function hashPassword(password) {
  return await argon2.hash(password, ARGON2_CONFIG);
}

export async function comparePassword(password, hashNoBanco) {
  try {
    // DETECÇÃO DE LEGADO (Under the Hood):
    // Hashes Bcrypt começam com $2b$ ou $2a$. Hashes Argon2 começam com $argon2id$.
    if (hashNoBanco.startsWith('$2b$') || hashNoBanco.startsWith('$2a$')) {
      const isValid = await bcrypt.compare(password, hashNoBanco);
      // Retornamos uma flag avisando que este usuário tem um hash obsoleto
      return { isValid, isLegacy: true }; 
    }

    if (hashNoBanco.startsWith('$argon2')) {
      const isValid = await argon2.verify(hashNoBanco, password);
      return { isValid, isLegacy: false };
    }

    throw new Error("Formato de criptografia não suportado.");
  } catch (error) {
    throw new Error(`Falha na validação do hash: ${error.message}`);
  }
}