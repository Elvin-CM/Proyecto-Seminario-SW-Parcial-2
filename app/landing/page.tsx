"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Truck, Shield, RefreshCw, HeadphonesIcon, ShoppingBag } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] md:min-h-screen flex items-center pt-16 md:pt-20 overflow-hidden">
        {/* Background - Monochromatic */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100"></div>
        <div className="absolute top-20 right-0 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-gray-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-gray-300/30 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 md:space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 py-2 bg-gray-100 rounded-full border border-gray-200">
                <ShoppingBag className="h-3 w-3 md:h-4 md:w-4 text-gray-700" />
                <span className="text-xs md:text-sm font-medium text-gray-700">La nueva generación del comercio electrónico</span>
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-black">
                Transforma tu{' '}
                <span className="text-gray-600">
                  experiencia
                </span>{' '}
                de compras
              </h1>
              <p className="text-base md:text-xl text-gray-600 max-w-lg mx-auto lg:mx-0">
                Descubre un mundo de productos únicos con entrega rápida, precios competitivos y una experiencia de compra sin igual.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center lg:justify-start">
                <Link href="/auth/register">
                  <Button size="lg" className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white text-base md:text-lg px-6 md:px-8 py-5 md:py-6">
                    Empezar Ahora
                    <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </Link>
                <Link href="/catalog">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-5 md:py-6 border-2 border-black text-black hover:bg-gray-100">
                    Ver Catálogo
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-6 md:gap-8 pt-2 md:pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-white text-xs md:text-sm font-medium">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div className="text-center md:text-left">
                  <div className="flex items-center gap-1 justify-center md:justify-start">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 md:h-5 md:w-5 fill-gray-600 text-gray-600" />
                    ))}
                  </div>
                  <p className="text-xs md:text-sm text-gray-600">+10,000 clientes satisfechos</p>
                </div>
              </div>
            </div>
            
            {/* Hero Images - Visible on all screens */}
            <div className="relative">
              <div className="relative z-10 grid grid-cols-2 gap-2 md:gap-4">
                <div className="space-y-2 md:space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gray-500 rounded-3xl blur opacity-10 group-hover:opacity-20 transition"></div>
                    <img 
                      src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=500&fit=crop" 
                      alt="Producto premium"
                      className="relative rounded-3xl shadow-2xl w-full h-32 md:h-64 object-cover transform group-hover:scale-105 transition duration-500"
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gray-500 rounded-3xl blur opacity-10 group-hover:opacity-20 transition"></div>
                    <img 
                      src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=350&fit=crop" 
                      alt="Accesorios"
                      className="relative rounded-3xl shadow-2xl w-full h-24 md:h-48 object-cover transform group-hover:scale-105 transition duration-500"
                    />
                  </div>
                </div>
                <div className="space-y-2 md:space-y-4 pt-4 md:pt-8">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gray-500 rounded-3xl blur opacity-10 group-hover:opacity-20 transition"></div>
                    <img 
                      src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=350&fit=crop" 
                      alt="Electrónica"
                      className="relative rounded-3xl shadow-2xl w-full h-24 md:h-48 object-cover transform group-hover:scale-105 transition duration-500"
                    />
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gray-500 rounded-3xl blur opacity-10 group-hover:opacity-20 transition"></div>
                    <img 
                      src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=500&fit=crop" 
                      alt="Moda"
                      className="relative rounded-3xl shadow-2xl w-full h-32 md:h-64 object-cover transform group-hover:scale-105 transition duration-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-black">
              ¿Por qué elegirnos?
            </h2>
            <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
              Ofrecemos la mejor experiencia de compra online con características diseñadas para ti
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: Truck, title: "Envío Rápido", desc: "Entrega en 24-48 horas", color: "bg-gray-100 text-gray-700" },
              { icon: Shield, title: "Compra Segura", desc: "Pagos 100% seguros", color: "bg-gray-100 text-gray-700" },
              { icon: RefreshCw, title: "Devolución", desc: "30 días para cambiar", color: "bg-gray-100 text-gray-700" },
              { icon: HeadphonesIcon, title: "Soporte 24/7", desc: "Siempre aquí para ti", color: "bg-gray-100 text-gray-700" },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-lg hover:shadow-xl transition hover:-translate-y-1 border border-gray-200">
                <div className={`w-12 h-12 md:w-16 md:h-16 ${feature.color} rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6`}>
                  <feature.icon className="h-6 w-6 md:h-8 md:w-8" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2 text-black">{feature.title}</h3>
                <p className="text-gray-600 text-sm md:text-base">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-black">
              Explora nuestras categorías
            </h2>
            <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
              Encuentra exactamente lo que buscas en nuestras categorías exclusivas
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { name: "Electrónica", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=400&fit=crop", count: "2,500+ productos" },
              { name: "Moda", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=400&fit=crop", count: "5,000+ productos" },
              { name: "Hogar", image: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600&h=400&fit=crop", count: "1,800+ productos" },
            ].map((cat, idx) => (
              <Link
                key={idx}
                href={`/catalog?cat=${encodeURIComponent(cat.name)}`}
                className="group relative overflow-hidden rounded-2xl md:rounded-3xl block"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-56 md:h-80 object-cover transform group-hover:scale-110 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">
                    {cat.name}
                  </h3>
                  <p className="text-white/80 text-sm md:text-base">{cat.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-black">
              Productos Destacados
            </h2>
            <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
              Las mejores ofertas en productos seleccionados especialmente para ti
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              { name: "Smartwatch Pro", price: "$299", oldPrice: "$399", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop", discount: "-25%" },
              { name: "Auriculares Wireless", price: "$149", oldPrice: "$199", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop", discount: "-25%" },
              { name: "Cámara Digital", price: "$599", oldPrice: "$799", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop", discount: "-25%" },
              { name: "Gaming Chair", price: "$349", oldPrice: "$449", image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=400&fit=crop", discount: "-25%" },
            ].map((product, idx) => (
              <div key={idx} className="bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition hover:-translate-y-2 group border border-gray-200">
                <div className="relative">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-48 md:h-64 object-cover"
                  />
                  <div className="absolute top-3 md:top-4 right-3 md:right-4 bg-black text-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold">
                    {product.discount}
                  </div>
                </div>
                <div className="p-4 md:p-6">
                  <h3 className="text-base md:text-lg font-bold mb-2 text-black group-hover:text-gray-600 transition">{product.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xl md:text-2xl font-bold text-black">{product.price}</span>
                    <span className="text-gray-400 line-through text-sm md:text-base">{product.oldPrice}</span>
                  </div>
                  <Button asChild className="w-full mt-3 md:mt-4 bg-black hover:bg-gray-800 text-sm md:text-base">
                    <Link href={`/catalog?q=${encodeURIComponent(product.name)}`}>
                      Explorar Productos
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10 md:mt-12">
            <Link href="/catalog">
              <Button size="lg" variant="outline" className="text-base md:text-lg px-6 md:px-8 border-2 border-black text-black hover:bg-gray-100">
                Ver Todos los Productos
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-30"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6">
            ¿Listo para empezar?
          </h2>
          <p className="text-base md:text-xl text-gray-300 mb-6 md:mb-8 max-w-2xl mx-auto">
            Únete a miles de clientes satisfechos y descubre una nueva forma de comprar online
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-black hover:bg-gray-100 text-base md:text-lg px-6 md:px-8 py-5 md:py-6">
                <ShoppingBag className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                Crear Cuenta Gratis
              </Button>
            </Link>
            <Link href="/catalog">
              <Button size="lg" variant="outline" className="bg-white text-black hover:bg-gray-100 text-base md:text-lg px-6 md:px-8 py-5 md:py-6">
                Explorar Productos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-black">
              Lo que dicen nuestros clientes
            </h2>
            <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
              Miles de clientes confían en nosotros cada día
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { name: "María García", role: "Cliente frecuente", text: "La mejor experiencia de compra online que he tenido. El envío es súper rápido y siempre llega en perfecto estado.", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
              { name: "Carlos López", role: "Emprendedor", text: "He comprado varios productos y la calidad es excepcional. El servicio al cliente es excelente.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
              { name: "Ana Martínez", role: "Influencer", text: "Recomiendo PrototypeStore a todos mis seguidores. Los productos son auténticos y la entrega siempre es rápida.", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-gray-50 rounded-2xl md:rounded-3xl p-6 md:p-8 border border-gray-200">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 md:h-5 md:w-5 fill-gray-600 text-gray-600" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 md:mb-6 leading-relaxed text-sm md:text-base">&ldquo;{testimonial.text}&rdquo;</p>
                <div className="flex items-center gap-3 md:gap-4">
                  <img src={testimonial.image} alt={testimonial.name} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover" />
                  <div>
                    <p className="font-bold text-black text-sm md:text-base">{testimonial.name}</p>
                    <p className="text-gray-500 text-xs md:text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-black">
              Preguntas Frecuentes
            </h2>
            <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto">
              Todo lo que necesitas saber sobre nuestra tienda
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-3 md:space-y-4">
            {[
              { q: "¿Cuánto tiempo tardan en enviar mi pedido?", a: "Normalmente entre 24-48 horas hábiles. El envío es gratis en pedidos mayores a $50." },
              { q: "¿Puedo devolver un producto?", a: "Sí, tienes 30 días para cambiar o devolver cualquier producto. Solo contáctanos y te ayudamos." },
              { q: "¿Los productos son originales?", a: "Todos nuestros productos son 100% originales y cuentan con garantía." },
              { q: "¿Qué métodos de pago aceptan?", a: "Aceptamos todas las tarjetas de crédito, PayPal y pagos en efectivo contra entrega." },
            ].map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-md border border-gray-200">
                <h3 className="font-bold text-base md:text-lg mb-2 text-black">{faq.q}</h3>
                <p className="text-gray-600 text-sm md:text-base">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

