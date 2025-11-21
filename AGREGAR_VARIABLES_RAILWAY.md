# 🔧 Cómo Agregar Variables de Entorno en Railway

## 🔍 Problema: "No me deja agregar variables con el mismo nombre"

Esto significa que **la variable ya existe**. Tienes dos opciones:

## ✅ Solución 1: Editar la Variable Existente

1. Ve a Railway → Tu Servicio → **Settings** → **Variables**
2. Verás una lista de todas las variables existentes
3. Busca la variable que quieres cambiar (ej: `JWT_SECRET`)
4. Haz clic en el **lápiz (✏️)** o en el **valor** de la variable
5. Cambia el valor
6. Haz clic en **"Save"** o **"Update"**

## ✅ Solución 2: Eliminar y Crear de Nuevo

1. Ve a Railway → Tu Servicio → **Settings** → **Variables**
2. Busca la variable que quieres cambiar
3. Haz clic en el **icono de basura (🗑️)** o en **"Delete"**
4. Confirma la eliminación
5. Haz clic en **"New Variable"** o **"Add Variable"**
6. Agrega la variable con el nuevo valor

## 📋 Variables Necesarias

Estas son las variables que necesitas (si ya existen, edítalas):

### Variable 1: NODE_ENV
- **Key**: `NODE_ENV`
- **Value**: `production`
- **¿Ya existe?** Si existe, edítala. Si no, créala.

### Variable 2: JWT_SECRET
- **Key**: `JWT_SECRET`
- **Value**: `tu-secreto-super-seguro-12345` (cambia esto por un string largo)
- **¿Ya existe?** Si existe, edítala. Si no, créala.

### Variable 3: FRONTEND_URL
- **Key**: `FRONTEND_URL`
- **Value**: `https://tu-app.netlify.app` (reemplaza con tu URL real)
- **¿Ya existe?** Si existe, edítala. Si no, créala.

### Variable 4: NETLIFY_URL
- **Key**: `NETLIFY_URL`
- **Value**: `https://tu-app.netlify.app` (reemplaza con tu URL real)
- **¿Ya existe?** Si existe, edítala. Si no, créala.

## 🎯 Pasos Detallados para Editar

### Paso 1: Acceder a Variables
1. Railway → Tu Servicio
2. **Settings** (arriba)
3. **Variables** (menú lateral izquierdo)

### Paso 2: Ver Variables Existentes
Verás una tabla o lista con:
- **Name** (Nombre de la variable)
- **Value** (Valor - puede estar oculto con •••)
- **Actions** (Acciones: editar, eliminar)

### Paso 3: Editar una Variable
1. Haz clic en el **lápiz (✏️)** o en el **valor**
2. Se abrirá un formulario o modal
3. Cambia el **Value**
4. Haz clic en **"Save"** o **"Update"**

### Paso 4: Agregar Nueva Variable (si no existe)
1. Haz clic en **"New Variable"** o **"Add Variable"**
2. Completa:
   - **Key**: Nombre de la variable (ej: `JWT_SECRET`)
   - **Value**: Valor de la variable (ej: `mi-secreto-12345`)
3. Haz clic en **"Add"** o **"Save"**

## ⚠️ Variables Importantes

**NO necesitas configurar `PORT`** - Railway lo asigna automáticamente.

**Solo necesitas estas 4 variables:**
1. `NODE_ENV=production`
2. `JWT_SECRET=tu-secreto-aqui`
3. `FRONTEND_URL=https://tu-app.netlify.app`
4. `NETLIFY_URL=https://tu-app.netlify.app`

## 🔍 Verificar Variables

Después de agregar/editar, verifica que:
- [ ] Todas las 4 variables estén en la lista
- [ ] Los valores sean correctos
- [ ] No haya variables duplicadas

## 🆘 Si No Puedes Editar

Si Railway no te deja editar:
1. **Elimina la variable** (icono de basura)
2. **Crea una nueva** con el mismo nombre y nuevo valor
3. Railway hará un redeploy automáticamente

## 💡 Tip

Si una variable ya existe pero tiene un valor incorrecto:
- **Edítala** en lugar de crear una nueva
- Esto evita duplicados y conflictos

