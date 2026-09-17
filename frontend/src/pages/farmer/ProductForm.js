import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, ArrowRight, Save, Sprout } from 'lucide-react';
import { useAuth, useMarket, useUI } from '../../context/AppContext';
import { categories, districts, towns, qualities, methods, statuses } from '../../data/seed';
import { Field, Select, Checkbox, PageHeading, EmptyState, Img } from '../../components/common/UI';
import AIPriceAdvisor from '../../components/ai/AIPriceAdvisor';
import ImageUploader from '../../components/forms/ImageUploader';
import { money } from '../../utils/helpers';
const steps = [
  'Product',
  'Harvest',
  'Quantity & quality',
  'Location',
  'AI price advisor',
  'Pricing',
  'Fulfillment',
  'Images',
  'Review & publish',
];
export default function ProductForm() {
  const { id } = useParams(),
    navigate = useNavigate();
  const { user } = useAuth();
  const { products, setProducts } = useMarket();
  const { notify } = useUI();
  const existing = products.find((p) => p.id === id && p.farmerId === user.id);
  const key = `f2h:draft:${user.id}:${id || 'new'}`;
  const [form, setForm] = useState(() => {
    try {
      const draft = JSON.parse(sessionStorage.getItem(key));
      if (draft) return draft;
    } catch {}
    return (
      (existing ? { ...existing, bulkPrice: existing.bulkPrice || '' } : null) || {
        name: '',
        category: 'Vegetables',
        description: '',
        harvestDate: '',
        availableDate: '',
        expiryDate: '',
        method: 'Conventional',
        quantity: 50,
        unit: 'kg',
        quality: 'Grade A',
        district: user.district || 'Vavuniya',
        city: user.city || 'Vavuniya',
        location: '',
        price: '',
        bulkPrice: '',
        bulkThreshold: 20,
        delivery: true,
        pickup: true,
        deliveryNotes: '',
        pickupNotes: '',
        images: [],
        availability: 'Available',
        enabled: true,
      }
    );
  });
  const [step, setStep] = useState(0),
    [errors, setErrors] = useState({});
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(form));
    } catch {
      notify('Draft could not be saved. Try fewer images.', 'error');
    }
  }, [form]);
  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v, ...(k === 'district' ? { city: towns[v][0] } : {}) }));
    setErrors((old) => ({ ...old, [k]: null }));
  };
  function validate(s) {
    const e = {};
    if (s === 0) {
      if (form.name.trim().length < 3) e.name = 'Use at least 3 characters.';
      if (form.description.trim().length < 10)
        e.description = 'Describe your produce in at least 10 characters.';
    }
    if (s === 1) {
      if (!form.harvestDate) e.harvestDate = 'Choose a harvest date.';
      if (!form.availableDate) e.availableDate = 'Choose an available date.';
      if (form.availableDate < form.harvestDate)
        e.availableDate = 'Availability cannot precede harvest.';
      if (form.expiryDate && form.expiryDate < form.availableDate)
        e.expiryDate = 'Expiry must be on or after availability.';
    }
    if (s === 2) {
      if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 0)
        e.quantity = 'Enter a whole, non-negative quantity.';
    }
    if (s === 3) {
      if (!form.district) e.district = 'Choose a district.';
      if (!form.city) e.city = 'Choose a city.';
    }
    if (s === 5) {
      if (!Number.isFinite(Number(form.price)) || Number(form.price) <= 0)
        e.price = 'Enter a selling price above zero.';
      if (
        form.bulkPrice !== '' &&
        (Number(form.bulkPrice) <= 0 || Number(form.bulkPrice) >= Number(form.price))
      )
        e.bulkPrice = 'Bulk price must be positive and below the regular price.';
      if (
        form.bulkPrice !== '' &&
        (!Number.isInteger(Number(form.bulkThreshold)) || Number(form.bulkThreshold) < 1)
      )
        e.bulkThreshold = 'Enter a positive whole number.';
    }
    if (s === 6 && !form.delivery && !form.pickup)
      e.fulfillment = 'Select delivery, pickup, or both.';
    if (s === 7 && !form.images.length) e.images = 'Upload at least one product photo.';
    return e;
  }
  function next() {
    const e = validate(step);
    setErrors(e);
    if (!Object.keys(e).length) setStep(Math.min(8, step + 1));
  }
  function save(draft = false) {
    if (!draft) {
      for (let s = 0; s < 8; s++) {
        const e = validate(s);
        if (Object.keys(e).length) {
          setErrors(e);
          setStep(s);
          return;
        }
      }
    }
    const product = {
      ...form,
      id: existing?.id || crypto.randomUUID(),
      farmerId: user.id,
      quantity: Number(form.quantity),
      price: Number(form.price),
      bulkPrice: Number(form.bulkPrice) || 0,
      bulkThreshold: Number(form.bulkThreshold) || 20,
      draft,
      rating: existing?.rating || 0,
      reviewCount: existing?.reviewCount || 0,
      popularity: existing?.popularity || 0,
      views: existing?.views || 0,
      createdAt: existing?.createdAt || new Date().toISOString(),
      availability: Number(form.quantity) === 0 ? 'Sold Out' : form.availability,
    };
    setProducts((old) =>
      existing ? old.map((p) => (p.id === existing.id ? product : p)) : [product, ...old],
    );
    sessionStorage.removeItem(key);
    notify(draft ? 'Draft saved.' : existing ? 'Product updated.' : 'Your harvest is live!');
    navigate('/farmer/products');
  }
  if (id && !existing)
    return <EmptyState title="Product not found." to="/farmer/products" label="My products" />;
  const input = (k, label, type = 'text', extra = {}) => (
    <Field
      label={label}
      type={type}
      value={form[k]}
      error={errors[k]}
      onChange={(e) => set(k, e.target.value)}
      {...extra}
    />
  );
  return (
    <>
      <PageHeading
        eyebrow="SHARE SOMETHING GOOD"
        title={existing ? 'Edit your harvest' : 'Let’s bring your harvest to market.'}
        description="A few thoughtful details help customers choose with confidence."
      />
      <div className="wizard-progress">
        {steps.map((label, i) => (
          <div key={label} className={i === step ? 'active' : i < step ? 'done' : ''}>
            <span>{i < step ? <Check size={14} /> : i + 1}</span>
            <small>{label}</small>
          </div>
        ))}
      </div>
      <section className="panel product-form">
        <div className="between">
          <h2>{steps[step]}</h2>
          <span className="muted">Step {step + 1} of 9</span>
        </div>
        {step === 0 && (
          <>
            {input('name', 'Product name', 'text', { placeholder: 'e.g. Fresh Tomatoes' })}
            <Select
              label="Category"
              options={categories}
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
            />
            <Field label="Description" error={errors.description}>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Tell customers what makes your produce special."
              />
            </Field>
          </>
        )}
        {step === 1 && (
          <>
            <div className="form-row">
              {input('harvestDate', 'Harvest date', 'date')}
              {input('availableDate', 'Available from', 'date')}
            </div>
            {input('expiryDate', 'Freshness / expiry date', 'date')}
            <Select
              label="Farming method"
              options={methods}
              value={form.method}
              onChange={(e) => set('method', e.target.value)}
            />
          </>
        )}
        {step === 2 && (
          <>
            <div className="form-row">
              {input('quantity', 'Available quantity', 'number', { min: 0, step: 1 })}
              <Select
                label="Unit"
                options={['kg', 'g', 'bundle', 'piece', 'dozen', 'bag', 'box']}
                value={form.unit}
                onChange={(e) => set('unit', e.target.value)}
              />
            </div>
            <Select
              label="Quality"
              options={qualities}
              value={form.quality}
              onChange={(e) => set('quality', e.target.value)}
            />
            <Select
              label="Availability"
              options={statuses}
              value={form.availability}
              onChange={(e) => set('availability', e.target.value)}
            />
          </>
        )}
        {step === 3 && (
          <>
            <div className="form-row">
              <Select
                label="District"
                options={districts}
                value={form.district}
                onChange={(e) => set('district', e.target.value)}
              />
              <Select
                label="City / town"
                options={towns[form.district] || []}
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
              />
            </div>
            {input('location', 'Approximate farm location', 'text', {
              placeholder: 'Village or nearby landmark, no private home coordinates',
            })}
            <p className="muted">Only the approximate farm region is shown publicly.</p>
          </>
        )}
        {step === 4 && (
          <AIPriceAdvisor
            product={form}
            onApply={(price) => {
              set('price', price);
              notify('Suggested price applied. You can still edit it.');
              setStep(5);
            }}
            onManual={() => setStep(5)}
          />
        )}{' '}
        {step === 5 && (
          <>
            {input('price', 'Final price (Rs. per ' + form.unit + ')', 'number', {
              min: 0.01,
              step: 0.01,
            })}
            <div className="form-row">
              {input('bulkPrice', 'Bulk price (optional)', 'number', { min: 0.01, step: 0.01 })}
              {input('bulkThreshold', 'Minimum bulk quantity', 'number', { min: 1, step: 1 })}
            </div>
            <div className="notice">
              Your price, your choice. An AI suggestion is never required to publish.
            </div>
          </>
        )}
        {step === 6 && (
          <>
            <Checkbox
              label="Home delivery available"
              checked={form.delivery}
              onChange={(e) => set('delivery', e.target.checked)}
            />
            <Checkbox
              label="Farm pickup available"
              checked={form.pickup}
              onChange={(e) => set('pickup', e.target.checked)}
            />
            {errors.fulfillment && <p className="error-text">{errors.fulfillment}</p>}
            {input('deliveryNotes', 'Delivery notes')}
            {input('pickupNotes', 'Pickup instructions')}
          </>
        )}
        {step === 7 && (
          <>
            <ImageUploader images={form.images} onChange={(images) => set('images', images)} />
            {errors.images && <p className="error-text">{errors.images}</p>}
          </>
        )}
        {step === 8 && (
          <>
            <div className="publish-preview">
              <Img src={form.images[0]} alt={form.name} />
              <div>
                <span className="eyebrow">{form.category}</span>
                <h2>{form.name}</h2>
                <p>{form.description}</p>
                <strong className="price">
                  {money(form.price)} / {form.unit}
                </strong>
                <p>
                  {form.quantity} {form.unit} · {form.quality} · {form.method}
                </p>
                <p>
                  {form.city}, {form.district}
                </p>
                <p>
                  {form.delivery ? 'Home delivery' : ''} {form.pickup ? ' · Farm pickup' : ''}
                </p>
                <p>
                  {form.availability} · Available {form.availableDate}
                </p>
              </div>
            </div>
            <div className="notice">
              <Sprout size={20} /> Ready to share your harvest with the community?
            </div>
          </>
        )}
        <div className="wizard-actions">
          <button
            className="btn secondary"
            disabled={step === 0}
            onClick={() => {
              setStep(step - 1);
              setErrors({});
            }}
          >
            <ArrowLeft size={16} />
            Previous
          </button>
          <button className="text-link" onClick={() => save(true)}>
            <Save size={16} />
            Save draft
          </button>
          {step < 8 ? (
            <button className="btn" onClick={next}>
              Next
              <ArrowRight size={16} />
            </button>
          ) : (
            <button className="btn" onClick={() => save(false)}>
              {existing ? 'Save changes' : 'Publish product'}
              <Check size={17} />
            </button>
          )}
        </div>
      </section>
    </>
  );
}
