export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <div className="site-footer-name">SQUIRES SOLUTIONS</div>
          <div className="site-footer-tagline">Premium Creative & Brand Design</div>
        </div>

        <div className="site-footer-contact">
          <div className="site-footer-contact-label">Contact</div>
          <a href="mailto:squiressolutions@gmail.com" className="site-footer-link">
            squiressolutions@gmail.com
          </a>
        </div>

        <div className="site-footer-right">
          <div className="site-footer-copy">
            &copy; {year} Squires Solutions. All rights reserved.
          </div>
          <div className="site-footer-powered">Powered by Claude AI</div>
        </div>
      </div>
    </footer>
  )
}
