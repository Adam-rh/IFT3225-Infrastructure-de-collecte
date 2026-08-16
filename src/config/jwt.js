// Un secret par défaut dans un dépôt public équivaut à aucun secret :
// mieux vaut refuser de démarrer qu'accepter des jetons forgeables.
export const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET est absent de l'environnement. Définissez-le dans .env (voir .env.example)."
  );
}

export const JWT_EXPIRATION = "7d";