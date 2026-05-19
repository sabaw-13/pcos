import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { baseMenuItems, menuCategories } from '../data/menudata';

const Landing = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -60px 0px' }
    );

    const revealItems = document.querySelectorAll('.reveal-on-scroll');
    revealItems.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  const menuImageByCategory = {
    appetizers: '/images/p3.jpg',
    'ramen-regular': '/images/p1.jpg',
    'ramen-special': '/images/p1.jpg',
    drinks: '/images/p4.jpg',
    'burger-sandwiches': '/images/p2.jpg',
    'rice-bowls': '/images/p1.jpg',
    'add-ons': '/images/p3.jpg',
    'short-orders': '/images/p3.jpg'
  };

  const menuOverview = baseMenuItems.map((item) => ({
    ...item,
    categoryName:
      menuCategories.find((category) => category.id === item.category)?.name || 'Menu Item',
    image: menuImageByCategory[item.category] || '/images/p3.jpg'
  }));

  const testimonials = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Regular Customer',
      quote: 'Best coffee in town. The ordering app makes it so convenient.',
      avatar: 'SJ'
    },
    {
      id: 2,
      name: 'Mike Chen',
      role: 'Business Owner',
      quote: 'Love the easy online delivery and consistent quality.',
      avatar: 'MC'
    },
    {
      id: 3,
      name: 'Emma Davis',
      role: 'Student',
      quote: 'Perfect study spot with amazing pastries and peaceful vibes.',
      avatar: 'ED'
    }
  ];

  const aboutHighlights = [
    {
      id: 1,
      title: 'Small Batch',
      description: 'Freshly brewed and prepared in small batches for better flavor and consistency.',
      icon: 'batch'
    },
    {
      id: 2,
      title: 'Online Delivery',
      description: 'Order online and get your favorites prepared for delivery.',
      icon: 'pickup'
    },
    {
      id: 3,
      title: 'Community First',
      description: 'A welcoming cafe vibe for students, families, and friends all day long.',
      icon: 'community'
    }
  ];

  const AboutIcon = ({ type }) => {
    if (type === 'batch') {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 4H18L17 19H7L6 4Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M9 2V4M15 2V4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 10C9 8.5 10.2 7.5 11.5 6.5M14 10C14 8.8 14.8 8.1 16 7.2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }

    if (type === 'pickup') {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 14H15V18H3V14Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M15 15H18L21 11H17L15 15Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="7" cy="19" r="2" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="17" cy="19" r="2" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="8" cy="9" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="9" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M3 20C3.3 16.7 5.5 15 8 15C10.5 15 12.7 16.7 13 20" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M11 20C11.3 17.3 13.1 16 16 16C18.6 16 20.6 17.5 21 20" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  };

  const StarIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.8L14.7 8.2L20.7 9.1L16.3 13.3L17.3 19.2L12 16.4L6.7 19.2L7.7 13.3L3.3 9.1L9.3 8.2L12 2.8Z"
        fill="currentColor"
      />
    </svg>
  );

  return (
    <div className="landing-container">
      <section className="hero-section">
        <div className="hero-blur hero-blur-top"></div>
        <div className="hero-blur hero-blur-bottom"></div>

        <div className="hero-shell">
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="hero-badge">
                <img src="/images/plogo.jpg" alt="Persimmonay logo" className="hero-badge-logo" />
                <span>Persimmonay Signature Experience</span>
              </div>

              <h1 className="hero-title">
                Savor the flavor, <span className="hero-title-accent">taste the difference.</span>
              </h1>

              <p className="hero-description">
                More than a meal, it's an experience. Handcrafted drinks, fresh pastries, and
                simple online reservation and delivery made for your daily rhythm.
              </p>

              <div className="hero-buttons">
                <Link to="/menu" className="btn btn-primary">
                  Order
                </Link>
                <Link to="/reservation" className="btn btn-secondary hero-secondary">
                  Delivery
                </Link>
              </div>

              <div className="hero-stats">
                <div className="hero-stat">
                  <div className="hero-stat-value">Cafe</div>
                  <p className="hero-stat-label">Cozy food hideout</p>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-value">Delivery</div>
                  <p className="hero-stat-label">Online ordering</p>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-value">Reserve</div>
                  <p className="hero-stat-label">Table requests</p>
                </div>
              </div>
            </div>

            <div className="hero-panel hero-photo-panel">
              <img
                src="/images/persi.jpg"
                alt="Persimmonay Cafe interior"
                className="hero-feature-image"
              />
              <div className="hero-photo-overlay"></div>
              <div className="hero-photo-brand">
                <img src="/images/plogo.jpg" alt="Persimmonay logo" className="hero-photo-logo" />
                <div>
                  <p className="hero-photo-title">Persimmonay Cafe</p>
                  <p className="hero-photo-subtitle">Coffee and food hideout</p>
                </div>
              </div>
              <div className="hero-image-caption">Your cozy coffee and food hideout.</div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="about-section">
        <div className="section-container about-modern">
          <div className="about-copy reveal-on-scroll">
            <h2 className="section-title section-title-center">About Persimmonay</h2>
            <p className="section-subtitle">
              Handcrafted coffee, comfort food, and a cozy vibe in one destination.
            </p>
            <p className="about-description">
              We focus on quality ingredients, thoughtful preparation, and friendly service to
              make every visit feel easy, warm, and satisfying.
            </p>
          </div>
          <div className="about-highlights about-highlights-grid">
            {aboutHighlights.map((item, idx) => (
              <article
                key={item.id}
                className="highlight-card reveal-on-scroll"
                style={{ '--delay': `${80 + idx * 80}ms` }}
              >
                <div className="highlight-icon" aria-hidden="true">
                  <AboutIcon type={item.icon} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="featured-section section-alt">
        <div className="section-container">
          <div className="section-header reveal-on-scroll">
            <h2 className="section-title section-title-center">Menu Overview</h2>
            <p className="section-subtitle section-title-center">
              Real favorites from the Persimmonay delivery menu.
            </p>
          </div>
          <div className="overview-grid">
            {menuOverview.map((item, idx) => (
              <article
                key={item.id}
                className="overview-card reveal-on-scroll"
                style={{ '--delay': `${idx * 70}ms` }}
              >
                <div className="overview-image-wrap">
                  <img src={item.image} alt={item.title} className="overview-image" />
                </div>
                <h3 className="overview-title">{item.name}</h3>
                <div className="overview-menu-meta">
                  <span>{item.categoryName}</span>
                  <strong>P{Number(item.price).toFixed(2)}</strong>
                </div>
                <p className="overview-description">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="section-container">
          <h2 className="section-title section-title-center reveal-on-scroll">How It Works</h2>
          <p className="section-subtitle section-title-center reveal-on-scroll">
            Order delivery or request a reservation from your user account.
          </p>
          <div className="steps-grid">
            {[
              { step: '1', title: 'Log In', desc: 'Open your user account' },
              { step: '2', title: 'Choose', desc: 'Reservation or delivery' },
              { step: '3', title: 'Submit', desc: 'Send the needed details' },
              { step: '4', title: 'Enjoy', desc: 'Wait for confirmation' }
            ].map((item, idx) => (
              <div key={idx} className="step-card reveal-on-scroll" style={{ '--delay': `${idx * 70}ms` }}>
                <div className="step-number">{item.step}</div>
                <h3 className="step-title">{item.title}</h3>
                <p className="step-description">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="testimonials-section section-alt">
        <div className="section-container">
          <h2 className="section-title section-title-center reveal-on-scroll">What Our Customers Say</h2>
          <p className="section-subtitle section-title-center reveal-on-scroll">
            Real feedback from customers who keep coming back.
          </p>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, idx) => (
              <div
                key={testimonial.id}
                className="testimonial-card reveal-on-scroll"
                style={{ '--delay': `${idx * 80}ms` }}
              >
                <div className="testimonial-header">
                  <div className="testimonial-avatar">{testimonial.avatar}</div>
                  <div className="testimonial-meta">
                    <div>
                      <h4 className="testimonial-name">{testimonial.name}</h4>
                      <p className="testimonial-role">{testimonial.role}</p>
                    </div>
                    <div className="testimonial-rating" aria-label="Rated 5 out of 5">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="rating-icon">
                          <StarIcon />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="testimonial-quote">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="section-container cta-container">
          <h2 className="cta-title">Ready to Order?</h2>
          <p className="cta-subtitle">
            Use your account for online delivery or an online reservation.
          </p>
          <Link to="/login" className="btn btn-cta">
            Open User Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;
