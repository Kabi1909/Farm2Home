import { useEffect, useRef, useState } from 'react';
import { Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { getPriceSuggestion } from '../../services/aiService';
import { money } from '../../utils/helpers';
export default function AIPriceAdvisor({ product, onApply, onManual }) {
  const [prediction, setPrediction] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const inputKey = JSON.stringify([
    product.name,
    product.category,
    product.district,
    product.quality,
    product.quantity,
    product.unit,
    product.harvestDate,
  ]);
  const result = prediction?.inputKey === inputKey ? prediction : null;
  const activeRequest = useRef({ id: 0, controller: null });
  useEffect(() => {
    setPrediction(null);
    setError('');
    setBusy(false);
    return () => {
      activeRequest.current.id += 1;
      activeRequest.current.controller?.abort();
    };
  }, [inputKey]);
  async function suggest() {
    activeRequest.current.controller?.abort();
    const controller = new AbortController();
    const requestId = activeRequest.current.id + 1;
    activeRequest.current = { id: requestId, controller };
    setBusy(true);
    setPrediction(null);
    setError('');
    try {
      const value = await getPriceSuggestion(
        {
          ...product,
          month: new Date(product.harvestDate).getMonth() + 1,
        },
        { signal: controller.signal },
      );
      if (activeRequest.current.id === requestId) setPrediction({ ...value, inputKey });
    } catch (err) {
      if (activeRequest.current.id === requestId && !controller.signal.aborted)
        setError(err.message);
    } finally {
      if (activeRequest.current.id === requestId) setBusy(false);
    }
  }
  return (
    <section className="ai-advisor">
      <div className="ai-title">
        <span>
          <Sparkles size={26} />
        </span>
        <div>
          <span className="eyebrow">A LITTLE GUIDANCE FOR YOUR HARVEST</span>
          <h2>AI Smart Price Advisor</h2>
        </div>
        <span className="badge green">Price estimate</span>
      </div>
      <p>Find a thoughtful starting price for your produce. You’re always in control.</p>
      <div className="ai-inputs">
        <span>
          <small>Product</small>
          <strong>{product.name || 'Your produce'}</strong>
        </span>
        <span>
          <small>Location</small>
          <strong>{product.district}</strong>
        </span>
        <span>
          <small>Quality</small>
          <strong>{product.quality}</strong>
        </span>
        <span>
          <small>Quantity</small>
          <strong>
            {product.quantity} {product.unit}
          </strong>
        </span>
      </div>
      {!result && !error && (
        <button type="button" className="btn" disabled={busy} onClick={suggest}>
          {busy ? (
            <>
              <span className="spinner" />
              Analyzing marketplace data…
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Get AI Price Suggestion
            </>
          )}
        </button>
      )}
      {result && (
        <div className="ai-result">
          <span className="eyebrow">RECOMMENDED PRICE</span>
          <div className="ai-price">
            {money(result.recommendedPrice)}
            <small> / {product.unit}</small>
          </div>
          <p className="price-range">
            Suggested range: {money(result.minimumPrice)} – {money(result.maximumPrice)} /{' '}
            {product.unit}
          </p>
          <span className="badge green">{result.confidence} confidence</span>
          <p>{result.source}</p>
          {result.marketComparison && (
            <p>
              Matching marketplace listings average {money(result.marketComparison.averagePrice)} /{' '}
              {product.unit}.
            </p>
          )}
          {result.marketNote && <p>{result.marketNote}</p>}
          <div className="actions">
            <button type="button" className="btn" onClick={() => onApply(result.recommendedPrice)}>
              Use {money(result.recommendedPrice)} <ArrowRight size={16} />
            </button>
            <button type="button" className="btn secondary" onClick={onManual}>
              Enter my own price
            </button>
            <button
              type="button"
              aria-label="Refresh suggestion"
              className="icon-btn"
              onClick={suggest}
              disabled={busy}
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      )}
      {error && (
        <div className="ai-result">
          <h3 className="error-text" role="alert">
            {error}
          </h3>
          <div className="actions">
            <button type="button" className="btn" onClick={suggest}>
              Try Again
            </button>
            <button type="button" className="btn secondary" onClick={onManual}>
              Enter Price Manually
            </button>
          </div>
        </div>
      )}
      <p className="ai-disclaimer">
        AI price suggestions are estimates based on available marketplace data and may not reflect
        the exact current market price. You can always set your own selling price.
      </p>
    </section>
  );
}
