# TDO - Landing Page y Rutas

## Estado: En progreso

## Plan de trabajo:

### 1. Rediseñar landing page con tonos monocromáticos (blanco y negro)
- [ ] Eliminar gradientes purple/blue
- Usar solo blanco, negro y grises
- Mantener el diseño profesional pero monocromático

### 2. Crear página de catálogo en /catalog
- [ ] Mover el contenido de app/(storefront)/page.tsx a app/catalog/page.tsx
- [ ] Mantener todos los filtros y funcionalidad

### 3. Configurar rutas correctas
- [ ] /landing = Landing page monocromática
- [ ] / = Redireccionar a /catalog o mostrar catálogo directamente
- [ ] /catalog = Catálogo con filtros

### 4. Actualizar botones de navegación
- [ ] "Ver todos los productos" debe llevar a /catalog
- [ ] Links del navbar actualizados

---

## Información gathered:

### Archivos analizados:
- `app/page.tsx` - Landing page actual (contiene gradientes purple/blue)
- `app/landing/page.tsx` - Otra versión de landing
- `app/(storefront)/page.tsx` - Catálogo con filtros

### Problema detectado:
- Los botones "Ver Catálogo" enlazan a `/catalog` que no existe
- El catálogo está en `/` (vía route group)
- La landing page usa colores no monocromáticos

