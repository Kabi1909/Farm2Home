import { Leaf, Truck, ShieldCheck, MapPin } from 'lucide-react';
export default function FarmBanner({
  title,
  subtitle,
  description,
  variant = 'standard',
  children,
}) {
  return (
    <section className={'farm-banner banner-' + variant}>
      <div className="container">
        <div className="banner-copy">
          <h1>{title}</h1>
          {subtitle && <h2>{subtitle}</h2>}
          {description && <p>{description}</p>}
          {children}
          {variant !== 'contact' && (
            <div className="banner-promises">
              {[
                [
                  variant === 'farmers' ? MapPin : Leaf,
                  variant === 'farmers' ? 'Local Farmers' : 'Fresh & Natural',
                  'Direct from farms',
                ],
                [Truck, 'Islandwide Delivery', 'To your doorstep'],
                [ShieldCheck, 'Quality You Can Trust', 'Carefully grown produce'],
              ].map(([Icon, label, text]) => (
                <div key={label}>
                  <span>
                    <Icon size={23} />
                  </span>
                  <p>
                    <strong>{label}</strong>
                    <small>{text}</small>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        <span className="handwritten">
          Good Food
          <br />
          Brighter Tomorrows
        </span>
      </div>
    </section>
  );
}
