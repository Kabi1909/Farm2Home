import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Leaf } from 'lucide-react';
import FarmBanner from '../../components/common/FarmBanner';
import FarmMap from '../../components/map/FarmMap';
import { Field, Select } from '../../components/common/UI';
import { useUI } from '../../context/AppContext';
export default function Contact() {
  const [sent, setSent] = useState(false);
  const { notify } = useUI();
  function submit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const message = Object.fromEntries(form);
    localStorage.setItem(
      'f2h:contactDraft',
      JSON.stringify({ ...message, date: new Date().toISOString() }),
    );
    setSent(true);
    notify('Your message was saved locally. No email was sent in this demo.');
    e.currentTarget.reset();
  }
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
              Fill out the form below. In this frontend demo, messages are saved on your device.
            </p>
            <form onSubmit={submit}>
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
              {sent && (
                <p role="status" className="notice">
                  Message saved locally. This demonstration does not send email.
                </p>
              )}
            </form>
          </section>
          <aside className="contact-details panel">
            <h2>Get in Touch</h2>
            <p>Reach us through any of the following channels.</p>
            {[
              [Mail, 'Email', 'support@farm2home.example', 'Demo address — no messages are sent.'],
              [Phone, 'Phone', '+94 77 123 4567', 'Illustrative contact · Mon–Fri, 8 AM–5 PM'],
              [
                MapPin,
                'Office Address',
                'Farm2Home LK',
                'Vavuniya, Sri Lanka · approximate demo location',
              ],
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
            <p>Find our approximate demonstration location on the map.</p>
            <FarmMap lat={8.75} lng={80.5} name="Farm2Home LK · Vavuniya" />
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
              Choose home delivery at checkout for Rs. 250 per farm, or free farm pickup. Each
              farmer confirms their own order. All transactions are simulated.
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
              No. Farmers can always enter their own selling price and continue if the mock advisor
              is unavailable.
            </p>
          </details>
        </section>
      </div>
    </main>
  );
}
