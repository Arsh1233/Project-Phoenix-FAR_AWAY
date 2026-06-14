import os
import time
import base64
import secrets
# pyrefly: ignore [missing-import]
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# 521-bit Mersenne Prime for Galois Field arithmetic
PRIME = 2**521 - 1

def _eval_at(poly, x, prime):
    """Evaluates polynomial (coefficient tuple) at x, used to generate a share."""
    accum = 0
    for coeff in reversed(poly):
        accum *= x
        accum += coeff
        accum %= prime
    return accum

def _extended_gcd(a, b):
    """Extended Euclidean algorithm"""
    x, y, u, v = 0, 1, 1, 0
    while a != 0:
        q, r = b // a, b % a
        m, n = x - u * q, y - v * q
        b, a, x, y, u, v = a, r, u, v, m, n
    return b, x, y

def _mod_inverse(k, prime):
    gcd, x, y = _extended_gcd(k, prime)
    if gcd != 1:
        raise ValueError(f"No mod inverse for {k} modulo {prime}")
    return x % prime

def split_secret(secret_int, n, k, prime=PRIME):
    """
    Split a secret integer into n shares with a threshold of k.
    """
    if k > n:
        raise ValueError("Threshold k cannot be greater than n")
    
    # poly[0] is the secret. poly[1..k-1] are random coefficients.
    poly = [secret_int] + [secrets.randbelow(prime) for _ in range(k - 1)]
    
    shares = []
    for i in range(1, n + 1):
        x = i
        y = _eval_at(poly, x, prime)
        shares.append((x, y))
    
    return shares

def recover_secret(shares, prime=PRIME):
    """
    Recover the secret integer from k shares using Lagrange interpolation.
    """
    if len(shares) < 2:
        raise ValueError("Need at least 2 shares to recover (assuming k>=2)")

    secret = 0
    for i, (x_i, y_i) in enumerate(shares):
        num = 1
        den = 1
        for j, (x_j, y_j) in enumerate(shares):
            if i == j:
                continue
            num = (num * -x_j) % prime
            den = (den * (x_i - x_j)) % prime
            
        inv_den = _mod_inverse(den, prime)
        term = (y_i * num * inv_den) % prime
        secret = (secret + term) % prime
        
    return secret

def encrypt_data(data: bytes) -> tuple[bytes, bytes, bytes]:
    """
    Encrypts data using AES-GCM. Returns (aes_key, nonce, ciphertext).
    """
    aes_key = AESGCM.generate_key(bit_length=256)
    aesgcm = AESGCM(aes_key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, data, None)
    return aes_key, nonce, ciphertext

def decrypt_data(aes_key: bytes, nonce: bytes, ciphertext: bytes) -> bytes:
    """
    Decrypts data using AES-GCM.
    """
    aesgcm = AESGCM(aes_key)
    return aesgcm.decrypt(nonce, ciphertext, None)

def create_time_locked_fragments(question_text: str, n: int, k: int):
    """
    Encrypts question text, splits the AES key into n SSS shares.
    Returns (nonce, ciphertext, shares).
    """
    data = question_text.encode('utf-8')
    aes_key, nonce, ciphertext = encrypt_data(data)
    
    # Convert 32-byte AES key to integer
    secret_int = int.from_bytes(aes_key, 'big')
    
    # Generate SSS shares
    shares = split_secret(secret_int, n, k)
    
    return nonce, ciphertext, shares

def recover_time_locked_data(nonce: bytes, ciphertext: bytes, shares: list) -> str:
    """
    Recovers the AES key from SSS shares and decrypts the ciphertext.
    """
    secret_int = recover_secret(shares)
    
    # Convert back to 32-byte bytes
    aes_key = secret_int.to_bytes(32, 'big')
    
    data = decrypt_data(aes_key, nonce, ciphertext)
    return data.decode('utf-8')

# The TLE (Time-Lock Encryption) logic will be enforced at the API layer 
# by checking timestamps before returning fragments or decrypting.
