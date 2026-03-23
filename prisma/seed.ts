import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando sembrado de base de datos...')

  // 1. CLEANUP: Delete everything to start fresh
  // Order matters! We must delete children before parents.
  console.log('🧹 Limpiando datos antiguos...')
  await prisma.cartEntry.deleteMany()
  await prisma.cart.deleteMany()
  await prisma.stockReservation.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.account.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@prototypestore.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Administrador',
      role: 'ADMIN',
      password: await bcrypt.hash(adminPassword, 10),
    },
    create: {
      email: adminEmail,
      name: 'Administrador',
      role: 'ADMIN',
      password: await bcrypt.hash(adminPassword, 10),
    },
  })

  // 2. Create Categories
  console.log('📁 Creando categorías...')
  
  const catElectronics = await prisma.category.create({ data: { name: 'Electrónica' } })
  const catClothing = await prisma.category.create({ data: { name: 'Ropa' } })
  const catHome = await prisma.category.create({ data: { name: 'Hogar' } })
  const catAccessories = await prisma.category.create({ data: { name: 'Accesorios' } })

  // 3. Create Products
  console.log('📦 Creando productos...')

  const products = [
    // --- ELECTRÓNICA ---
    {
      name: 'Audífonos Pro Inalámbricos',
      slug: 'audifonos-pro-inalambricos',
      description: 'Audio de alta fidelidad con cancelación activa de ruido. 20h de batería.',
      price: 199.99,
      stock: 50,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      categoryId: catElectronics.id,
    },
    {
      name: 'Teclado Mecánico RGB',
      slug: 'teclado-mecanico',
      description: 'Switches táctiles para la mejor experiencia de escritura. Retroiluminado.',
      price: 129.50,
      stock: 15,
      image: 'https://images.unsplash.com/photo-1619683322755-4545503f1afa?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      categoryId: catElectronics.id,
    },
    {
      name: 'Monitor UltraWide 34"',
      slug: 'monitor-ultrawide-34',
      description: 'Pantalla curva 4K para productividad y gaming inmersivo. 144Hz.',
      price: 450.00,
      stock: 8,
      image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
      categoryId: catElectronics.id,
    },
    {
      name: 'Cámara Mirrorless 4K',
      slug: 'camara-mirrorless-4k',
      description: 'Captura momentos increíbles con sensor full-frame y grabación 4K.',
      price: 1200.00,
      stock: 5,
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
      categoryId: catElectronics.id,
    },
    {
      name: 'Reloj Inteligente Series 7',
      slug: 'reloj-inteligente-series-7',
      description: 'Monitoreo de salud avanzado, GPS y resistencia al agua.',
      price: 399.00,
      stock: 25,
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80',
      categoryId: catElectronics.id,
    },

    // --- ROPA ---
    {
      name: 'Sudadera Minimalista',
      slug: 'sudadera-minimalista',
      description: '100% algodón orgánico. Comodidad pesada para días fríos.',
      price: 59.00,
      stock: 100,
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80',
      categoryId: catClothing.id,
    },
    {
      name: 'Chaqueta Denim Clásica',
      slug: 'chaqueta-denim',
      description: 'Estilo atemporal con durabilidad superior. Corte moderno.',
      price: 89.99,
      stock: 40,
      image: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800&q=80',
      categoryId: catClothing.id,
    },
    {
      name: 'Camiseta Básica Premium',
      slug: 'camiseta-basica-negra',
      description: 'El esencial perfecto. Algodón Pima suave y transpirable.',
      price: 25.00,
      stock: 200,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
      categoryId: catClothing.id,
    },
    {
      name: 'Zapatillas Urbanas Blancas',
      slug: 'zapatillas-urbanas',
      description: 'Diseño limpio y minimalista para cualquier ocasión.',
      price: 75.00,
      stock: 30,
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80',
      categoryId: catClothing.id,
    },
    {
      name: 'Gorra de Béisbol Vintage',
      slug: 'gorra-beisbol',
      description: 'Estilo retro con ajuste cómodo y visera curva.',
      price: 29.99,
      stock: 60,
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80',
      categoryId: catClothing.id,
    },

    // --- HOGAR ---
    {
      name: 'Lámpara de Escritorio LED',
      slug: 'lampara-escritorio',
      description: 'Iluminación ajustable con carga inalámbrica integrada.',
      price: 45.00,
      stock: 45,
      image: 'https://images.unsplash.com/photo-1621447980929-6638614633c8?q=80&w=736&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      categoryId: catHome.id,
    },
    {
      name: 'Planta Artificial Realista',
      slug: 'planta-artificial',
      description: 'Añade vida a tu espacio sin necesidad de mantenimiento.',
      price: 35.00,
      stock: 20,
      image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800&q=80',
      categoryId: catHome.id,
    },
    {
      name: 'Silla Ergonómica de Oficina',
      slug: 'silla-ergonomica',
      description: 'Soporte lumbar avanzado para largas jornadas de trabajo.',
      price: 250.00,
      stock: 10,
      image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=800&q=80',
      categoryId: catHome.id,
    },
    {
      name: 'Juego de Tazas de Cerámica',
      slug: 'juego-tazas',
      description: 'Diseño artesanal minimalista. Set de 4 piezas.',
      price: 40.00,
      stock: 55,
      image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80',
      categoryId: catHome.id,
    },
    {
      name: 'Difusor de Aromas',
      slug: 'difusor-aromas',
      description: 'Ultrasónico y silencioso. Incluye luz ambiental LED.',
      price: 32.50,
      stock: 35,
      image: 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=800&q=80',
      categoryId: catHome.id,
    },

    // --- ACCESORIOS ---
    {
      name: 'Mochila Impermeable',
      slug: 'mochila-impermeable',
      description: 'Ideal para laptops de 15". Diseño anti-robo.',
      price: 65.00,
      stock: 40,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
      categoryId: catAccessories.id,
    },
    {
      name: 'Billetera de Cuero',
      slug: 'billetera-cuero',
      description: 'Cuero genuino con protección RFID.',
      price: 45.00,
      stock: 70,
      image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80',
      categoryId: catAccessories.id,
    },
    {
      name: 'Gafas de Sol Polarizadas',
      slug: 'gafas-sol',
      description: 'Protección UV400 con marco ligero y resistente.',
      price: 55.00,
      stock: 25,
      image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80',
      categoryId: catAccessories.id,
    },
    {
      name: 'Botella Térmica 1L',
      slug: 'botella-termica',
      description: 'Mantiene bebidas frías por 24h y calientes por 12h.',
      price: 22.00,
      stock: 100,
      image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80',
      categoryId: catAccessories.id,
    },
    {
      name: 'Funda para Laptop',
      slug: 'funda-laptop',
      description: 'Interior acolchado suave para máxima protección.',
      price: 18.00,
      stock: 60,
      image: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80',
      categoryId: catAccessories.id,
    },
  ]

  for (const product of products) {
    await prisma.product.create({
      data: product,
    })
  }

  console.log(`🔐 Admin listo: ${adminEmail} / ${adminPassword}`)
  console.log('✅ Base de datos sembrada con éxito!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
