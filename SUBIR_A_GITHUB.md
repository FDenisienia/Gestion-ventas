# 📤 Subir Proyecto a GitHub

## ✅ Estado Actual

El repositorio Git ya está inicializado y el primer commit está hecho.

## 🚀 Pasos para Subir a GitHub

### Opción 1: Crear Repositorio Nuevo en GitHub (Recomendado)

1. **Ve a GitHub**
   - Abre [github.com](https://github.com) en tu navegador
   - Inicia sesión con tu cuenta

2. **Crear Nuevo Repositorio**
   - Haz clic en el botón **"+"** (arriba a la derecha)
   - Selecciona **"New repository"**

3. **Configurar el Repositorio**
   - **Repository name**: `Gestion-Ventas-App` (o el nombre que prefieras)
   - **Description**: "Sistema de Gestión de Ventas con React, Node.js y SQLite"
   - **Visibility**: 
     - ✅ **Public** (si quieres que sea público)
     - ✅ **Private** (si quieres que sea privado)
   - ⚠️ **NO marques** "Add a README file" (ya tenemos uno)
   - ⚠️ **NO marques** "Add .gitignore" (ya tenemos uno)
   - ⚠️ **NO marques** "Choose a license" (a menos que quieras agregar uno)

4. **Haz clic en "Create repository"**

5. **Conectar el Repositorio Local con GitHub**

   GitHub te mostrará comandos. Ejecuta estos en tu terminal:

   ```bash
   git remote add origin https://github.com/TU-USUARIO/Gestion-Ventas-App.git
   git branch -M main
   git push -u origin main
   ```

   **Reemplaza `TU-USUARIO`** con tu nombre de usuario de GitHub.

### Opción 2: Usar GitHub CLI (Si lo tienes instalado)

```bash
gh repo create Gestion-Ventas-App --public --source=. --remote=origin --push
```

## 🔐 Autenticación

Si GitHub te pide autenticación:

### Opción A: Personal Access Token (Recomendado)

1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Genera un nuevo token con permisos `repo`
3. Usa el token como contraseña cuando Git te lo pida

### Opción B: SSH (Más seguro a largo plazo)

1. Genera una clave SSH:
   ```bash
   ssh-keygen -t ed25519 -C "tu-email@ejemplo.com"
   ```

2. Agrega la clave a GitHub:
   - Copia el contenido de `~/.ssh/id_ed25519.pub`
   - Ve a GitHub → Settings → SSH and GPG keys → New SSH key
   - Pega la clave y guarda

3. Usa la URL SSH en lugar de HTTPS:
   ```bash
   git remote set-url origin git@github.com:TU-USUARIO/Gestion-Ventas-App.git
   ```

## ✅ Verificación

Después de hacer push:

1. Ve a tu repositorio en GitHub
2. Verifica que todos los archivos estén ahí
3. Verifica que NO estén los archivos sensibles:
   - ❌ `server/database.db`
   - ❌ `.env`
   - ❌ `node_modules/`

## 📝 Comandos Útiles

### Ver el estado del repositorio
```bash
git status
```

### Ver commits
```bash
git log --oneline
```

### Hacer cambios y subirlos
```bash
git add .
git commit -m "Descripción de los cambios"
git push
```

### Ver la URL del repositorio remoto
```bash
git remote -v
```

## 🎯 Siguiente Paso: Desplegar en Railway

Una vez que el proyecto esté en GitHub:

1. Ve a [railway.app](https://railway.app)
2. Conecta tu cuenta de GitHub
3. Selecciona "Deploy from GitHub repo"
4. Selecciona tu repositorio `Gestion-Ventas-App`
5. Sigue la guía en `DESPLEGAR_BACKEND_RAILWAY.md`

## ⚠️ Archivos que NO se Suben (Gracias a .gitignore)

- ✅ `node_modules/` - Dependencias (se instalan con `npm install`)
- ✅ `dist/` - Archivos compilados (se generan con `npm run build`)
- ✅ `server/database.db` - Base de datos (se crea automáticamente)
- ✅ `.env` - Variables de entorno sensibles
- ✅ `server/backups/` - Backups de la base de datos

Estos archivos NO deben estar en GitHub por seguridad y tamaño.

