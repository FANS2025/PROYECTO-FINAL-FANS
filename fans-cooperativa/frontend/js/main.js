// frontend/assets/js/main.js

// --- FUNCIÓN showNotification (AHORA GLOBAL) ---
// Esta función se ha movido aquí para que sea accesible desde cualquier otro script (ej. auth.js, backoffice.js)
function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000); // Desaparece después de 5 segundos
}
// --- FIN FUNCIÓN showNotification GLOBAL ---


document.addEventListener('DOMContentLoaded', () => {
    // 1. Animaciones al hacer scroll (clase 'animate-on-scroll' y 'is-visible')
    const animateOnScrollElements = document.querySelectorAll('.animate-on-scroll');

    const observerOptions = {
        root: null, // viewport
        rootMargin: '0px 0px -10% 0px', // Activa 10% antes de llegar al fondo del viewport
        threshold: 0.1 // 10% del elemento visible para activar
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible'); // Clase para activar la animación
                observer.unobserve(entry.target); // Dejar de observar una vez que se muestra
            }
        });
    }, observerOptions);

    animateOnScrollElements.forEach(element => {
        observer.observe(element);
    });

    // 2. Transiciones suaves al hacer clic en enlaces de navegación
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight; // Altura del header fijo
                const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - headerHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 3. Efecto para el header al hacer scroll
    const header = document.getElementById('header');

    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) { // Cuando el usuario scrollea más de 50px
                header.classList.add('scrolled'); // Añade la clase 'scrolled'
            } else {
                header.classList.remove('scrolled'); // Elimina la clase 'scrolled'
            }
        });
    }

    // 4. Mobile Menu Toggle (para responsive)
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navigation = document.querySelector('.navigation');

    if (mobileMenuToggle && navigation) {
        mobileMenuToggle.addEventListener('click', () => {
            navigation.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
            // Opcional: Desactivar scroll en el body cuando el menú móvil está abierto
            // document.body.classList.toggle('no-scroll');
        });
    }

    // Cerrar menú móvil al hacer clic en un enlace de navegación
    document.querySelectorAll('.nav-list a').forEach(link => {
        link.addEventListener('click', () => {
            if (navigation.classList.contains('active')) {
                navigation.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                // document.body.classList.remove('no-scroll');
            }
        });
    });

    // 5. Efectos Hover para service cards
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
            this.style.boxShadow = '0 20px 50px var(--shadow-color)'; // Reaplicar sombra al hover
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 10px 30px var(--shadow-color)'; // Volver a la sombra normal
        });
    });

    // 6. Efecto Parallax para hero video
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroVideo = document.querySelector('.hero-video');
        
        if (heroVideo && scrolled < window.innerHeight) {
            heroVideo.style.transform = `translateY(${scrolled * 0.4}px)`; 
        }
    });

    // 7. Initialize animations on page load
    window.addEventListener('load', () => {
        setTimeout(() => {
            document.querySelectorAll('.animate-on-scroll').forEach((el) => {
                if (el.getBoundingClientRect().top < window.innerHeight) {
                    el.classList.add('is-visible');
                }
            });
        }, 300); // Pequeño retraso para que los elementos se carguen
    });

    // 8. General body opacity for loading effect
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    window.addEventListener('load', () => {
        document.body.style.opacity = '1';
    });

});