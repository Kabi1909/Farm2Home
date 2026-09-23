import { Mail, Phone, MapPin, Send, Leaf } from 'lucide-react';
import FarmBanner from '../../components/common/FarmBanner';
import FarmMap from '../../components/map/FarmMap';
import { Field, Select } from '../../components/common/UI';
export default function Contact() {
  return (
    <main>
      <FarmBanner
        title="Contact Us"
        subtitle="We’d love to hear from you!"
        description="Have a question, suggestion or need support? Our team is here to help you."
        variant="contact"
      />
      <div className="container contact-content">
        <div className="contact-grid">
          <section className="panel">
            <h2>Send Us a Message</h2>
            <p>
              Message submission is not available yet. Contact details will appear here when
              published.
            </p>
            <form onSubmit={(event) => event.preventDefault()}>
              <fieldset disabled style={{ border: 0, padding: 0 }}>
                <Field
                  label="Full Name *"
                  name="name"
                  required
                  minLength={2}
                  placeholder="Enter your full name"
                />
                <Field
                  label="Email Address *"
                  type="email"
                  name="email"
                  required
                  placeholder="Enter your email address"
                />
                <Select
                  label="Subject *"
                  name="subject"
                  required
                  options={[
                    { value: '', label: 'Select a subject' },
                    'Order support',
                    'Farmer registration',
                    'Product question',
                    'Delivery & pickup',
                    'Feedback',
                  ]}
                />
                <Field label="Message *">
                  <textarea
                    name="message"
                    required
                    minLength={10}
                    placeholder="Write your message here..."
                  />
                </Field>
                <button className="btn full">
                  <Send size={16} />
                  Send Message
                </button>
              </fieldset>
            </form>
          </section>
          <aside className="contact-details panel">
            <h2>Get in Touch</h2>
            <p>Published support details will be listed here.</p>
            {[
              [Mail, 'Email', 'Not published yet', ''],
              [Phone, 'Phone', 'Not published yet', ''],
              [MapPin, 'Office Address', 'Farm2Home LK', 'Office address not published yet'],
              [
                Leaf,
                'Our Community',
                'Support local. Choose fresh.',
                'Together for a healthier, greener Sri Lanka.',
              ],
            ].map(([Icon, title, value, note]) => (
              <div key={title}>
                <span>
                  <Icon size={25} />
                </span>
                <section>
                  <h3>{title}</h3>
                  <strong>{value}</strong>
                  <p>{note}</p>
                </section>
              </div>
            ))}
          </aside>
        </div>
        <div className="contact-bottom">
          <section className="panel">
            <h2>Our Location</h2>
            <p>A map will be available when our office location is published.</p>
            <FarmMap name="Farm2Home LK" />
          </section>
          <div className="contact-quote">
            <span>“</span>
            <h2>
              Together
              <br />
              for a healthier,
              <br />
              greener
              <br />
              Sri Lanka.
            </h2>
            <Leaf size={65} />
          </div>
        </div>
        <section className="panel faq" id="faq">
          <h2>A little help, when you need it</h2>
          <details id="delivery">
            <summary>How does delivery work?</summary>
            <p>
              Choose home delivery or farm pickup where offered. Delivery charges are shown at
              checkout. Each farmer confirms their own order.
            </p>
          </details>
          <details>
            <summary>How do I become a farmer?</summary>
            <p>
              Register with the Farmer role, complete your farm profile and publish your first
              harvest.
            </p>
          </details>
          <details>
            <summary>Is an AI price suggestion required?</summary>
            <p>
              No. Farmers can always enter their own selling price and continue if the advisor is
              unavailable.
            </p>
          </details>
        </section>
      </div>
    </main>
  );
}
