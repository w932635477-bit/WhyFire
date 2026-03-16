// WhyFire - UI Interactions

document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Navigation background on scroll
  const nav = document.querySelector('.nav');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
      nav.style.background = 'rgba(10, 10, 11, 0.95)';
      nav.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    } else {
      nav.style.background = 'rgba(10, 10, 11, 0.8)';
      nav.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
  });

  // Reveal animations on scroll
  const revealElements = document.querySelectorAll('.reveal');

  const revealOnScroll = () => {
    revealElements.forEach(el => {
      const elementTop = el.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;

      if (elementTop < windowHeight - 100) {
        el.classList.add('active');
      }
    });
  };

  window.addEventListener('scroll', revealOnScroll);
  revealOnScroll(); // Initial check

  // Button hover effects
  const buttons = document.querySelectorAll('.btn');

  buttons.forEach(btn => {
    btn.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
    });

    btn.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });

  // Mobile menu toggle
  const menuBtn = document.querySelector('.nav-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      menuBtn.classList.toggle('active');

      // Toggle menu animation
      const spans = menuBtn.querySelectorAll('span');
      if (menuBtn.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });
  }

  // Animate numbers on scroll
  const animateNumbers = () => {
    const numbers = document.querySelectorAll('.animate-number');

    numbers.forEach(num => {
      const target = parseInt(num.dataset.target);
      const current = parseInt(num.textContent);
      const increment = target / 50;

      if (current < target) {
        num.textContent = Math.ceil(current + increment);
        setTimeout(animateNumbers, 30);
      } else {
        num.textContent = target;
      }
    });
  };

  // Pricing card hover effect
  const pricingCards = document.querySelectorAll('.pricing-card');

  pricingCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      if (!this.classList.contains('pricing-popular')) {
        this.style.transform = 'translateY(-8px)';
      }
    });

    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });

  // Feature cards stagger animation
  const featureCards = document.querySelectorAll('.feature-card');

  featureCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
  });

  // Demo card typing effect
  const demoInput = document.querySelector('.demo-input span');
  if (demoInput) {
    const text = demoInput.textContent;
    demoInput.textContent = '';
    let i = 0;

    const typeWriter = () => {
      if (i < text.length) {
        demoInput.textContent += text.charAt(i);
        i++;
        setTimeout(typeWriter, 50);
      }
    };

    setTimeout(typeWriter, 1500);
  }

  // Result bar animations
  const resultFills = document.querySelectorAll('.result-fill');

  const animateBars = () => {
    resultFills.forEach((fill, index) => {
      const width = fill.style.width;
      fill.style.width = '0';

      setTimeout(() => {
        fill.style.width = width;
      }, 1200 + (index * 200));
    });
  };

  animateBars();

  // Parallax effect for hero glow
  const heroGlow = document.querySelector('.hero-glow');

  if (heroGlow) {
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;

      heroGlow.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

  console.log('🔥 WhyFire UI Loaded');
});

// Utility: Format number with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Utility: Copy to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}
