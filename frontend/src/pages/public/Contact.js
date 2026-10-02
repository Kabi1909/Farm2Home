import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Leaf } from 'lucide-react';
import FarmBanner from '../../components/common/FarmBanner';
import FarmMap from '../../components/map/FarmMap';
import { Field, Select } from '../../components/common/UI';
import { marketplaceApi } from '../../services/marketplaceApi.js';
import { useUI } from '../../context/AppContext';
export default function Contact() {
  const { notify } = useUI();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setSubmitError('');
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));

    try {
      await marketplaceApi.contact.send(values);
      form.reset();
      notify('Your message has been sent successfully.');
    } catch (error) {
      const validationMessage = error.fields?.map((field) => field.message).join(' ');
      setSubmitError(
        error.status === 400 && validationMessage
          ? validationMessage
          : 'Unable to send your message. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
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
            <p>Fill in the form below and we’ll get back to you as soon as possible.</p>
            <form onSubmit={submit}>
              <fieldset style={{ border: 0, padding: 0 }}>
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
                {submitError && (
                  <p className="error-text" role="alert">
                    {submitError}
                  </p>
                )}
                <button className="btn full" disabled={submitting}>
                  <Send size={16} />
                  {submitting ? 'Sending…' : 'Send Message'}
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
